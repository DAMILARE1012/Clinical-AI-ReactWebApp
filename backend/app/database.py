import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

logger = logging.getLogger(__name__)

MYSQL_URL = (
    f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}"
    f"@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"
)
SQLITE_URL = "sqlite:///./research_hub_dev.db"


def _try_mysql() -> bool:
    """Return True if MySQL is reachable, False otherwise."""
    placeholder = not settings.MYSQL_HOST or settings.MYSQL_HOST.upper().startswith("YOUR_")
    if placeholder:
        return False
    try:
        probe = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={"connect_timeout": 5})
        with probe.connect() as conn:
            conn.execute(text("SELECT 1"))
        probe.dispose()
        return True
    except Exception as exc:
        logger.warning("MySQL unreachable (%s) — falling back to SQLite for local dev", exc)
        return False


if _try_mysql():
    DATABASE_URL = MYSQL_URL
    engine = create_engine(
        MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
    )
    logger.info("Connected to MySQL: %s", settings.MYSQL_HOST)
else:
    DATABASE_URL = SQLITE_URL
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    logger.info("Using SQLite (local development)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
