from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from ..models.project import Project
from ..models.user import User, UserRole
from ..services.pinecone_service import upsert_text, delete_documents
from ..dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Shared knowledge base — all authenticated users see all projects
    return db.query(Project).order_by(Project.created_at.desc()).all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    await upsert_text(
        text=f"Project Title: {project.title}\n\nDescription:\n{project.description}",
        doc_id=f"project-{project.id}-description",
        metadata={
            "user_id": current_user.id,
            "project_id": project.id,
            "project_title": project.title,
            "content_type": "project_description",
        },
    )
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    # Re-embed whenever title or description changes
    if payload.title is not None or payload.description is not None:
        await upsert_text(
            text=f"Project Title: {project.title}\n\nDescription:\n{project.description}",
            doc_id=f"project-{project.id}-description",
            metadata={
                "user_id": project.user_id,
                "project_id": project.id,
                "project_title": project.title,
                "content_type": "project_description",
            },
        )
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Collect all Pinecone doc IDs for this project
    pinecone_ids = [f"project-{project.id}-description"]
    for exp in project.experiments:
        pinecone_ids += [
            f"experiment-{exp.id}-log",
            f"experiment-{exp.id}-results",
        ]

    await delete_documents(pinecone_ids)
    db.delete(project)
    db.commit()
