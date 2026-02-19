from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.experiment import ExperimentCreate, ExperimentUpdate, ExperimentResponse
from ..models.experiment import Experiment
from ..models.project import Project
from ..models.user import User, UserRole
from ..services.pinecone_service import upsert_text, delete_documents
from ..dependencies import get_current_user

router = APIRouter(tags=["Experiments"])


@router.get("/projects/{project_id}/experiments", response_model=List[ExperimentResponse])
def list_experiments(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(Experiment)
        .filter(Experiment.project_id == project_id)
        .order_by(Experiment.created_at.desc())
        .all()
    )


@router.post(
    "/projects/{project_id}/experiments",
    response_model=ExperimentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_experiment(
    project_id: int,
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    experiment = Experiment(
        project_id=project_id,
        title=payload.title,
        log_text=payload.log_text,
        results_text=payload.results_text,
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    base_meta = {
        "user_id": current_user.id,
        "project_id": project_id,
        "project_title": project.title,
        "experiment_id": experiment.id,
        "experiment_title": experiment.title,
    }

    if experiment.log_text:
        await upsert_text(
            text=f"Experiment: {experiment.title}\nLog:\n{experiment.log_text}",
            doc_id=f"experiment-{experiment.id}-log",
            metadata={**base_meta, "content_type": "experiment_log"},
        )

    if experiment.results_text:
        await upsert_text(
            text=f"Experiment: {experiment.title}\nResults:\n{experiment.results_text}",
            doc_id=f"experiment-{experiment.id}-results",
            metadata={**base_meta, "content_type": "experiment_results"},
        )

    return experiment


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@router.put("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    project = db.query(Project).filter(Project.id == experiment.project_id).first()
    if project.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(experiment, field, value)

    db.commit()
    db.refresh(experiment)

    base_meta = {
        "user_id": project.user_id,
        "project_id": project.id,
        "project_title": project.title,
        "experiment_id": experiment.id,
        "experiment_title": experiment.title,
    }

    if payload.log_text is not None:
        await upsert_text(
            text=f"Experiment: {experiment.title}\nLog:\n{experiment.log_text}",
            doc_id=f"experiment-{experiment.id}-log",
            metadata={**base_meta, "content_type": "experiment_log"},
        )

    if payload.results_text is not None:
        await upsert_text(
            text=f"Experiment: {experiment.title}\nResults:\n{experiment.results_text}",
            doc_id=f"experiment-{experiment.id}-results",
            metadata={**base_meta, "content_type": "experiment_results"},
        )

    return experiment


@router.delete("/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    project = db.query(Project).filter(Project.id == experiment.project_id).first()
    if project.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    await delete_documents(
        [f"experiment-{experiment_id}-log", f"experiment-{experiment_id}-results"]
    )
    db.delete(experiment)
    db.commit()
