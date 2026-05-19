import os

from .base import *  # noqa: F403

DJANGO_SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not DJANGO_SECRET_KEY or DJANGO_SECRET_KEY == "change-me-local-only":
    raise RuntimeError("DJANGO_SECRET_KEY must be set to a non-placeholder value in production.")

SECRET_KEY = DJANGO_SECRET_KEY
DEBUG = False
SECURE_CONTENT_TYPE_NOSNIFF = True
