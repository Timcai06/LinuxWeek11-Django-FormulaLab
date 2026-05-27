import os
from pathlib import Path

DEV_BASE_DIR = Path(__file__).resolve().parents[2]

os.environ.setdefault("DATABASE_URL", f"sqlite:///{DEV_BASE_DIR / 'var' / 'db.sqlite3'}")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from .base import *  # noqa: F403

DEBUG = True
