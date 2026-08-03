import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


class Config:
    # ==========================
    # Security
    # ==========================
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "serviceflow-secret-key",
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "serviceflow-jwt-secret-key",
    )

    # ==========================
    # Database
    # ==========================
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///serviceflow.db",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ==========================
    # Flask Environment
    # ==========================
    FLASK_ENV = os.getenv(
        "FLASK_ENV",
        "development",
    )

    DEBUG = os.getenv(
        "FLASK_DEBUG",
        "True",
    ).lower() == "true"