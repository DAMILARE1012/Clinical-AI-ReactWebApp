import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import auth, users, projects, experiments, chat

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt table creation (fails gracefully if DB unreachable)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created")
    except Exception as exc:
        logger.warning(
            "Could not connect to database on startup (expected if RDS endpoint not yet set): %s", exc
        )
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    description="REST API for the Clinical Research Knowledge Hub",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy", "service": settings.APP_NAME}
