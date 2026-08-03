import os
from dotenv import load_dotenv

# ==========================
# Load Environment Variables
# ==========================
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
    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite:///serviceflow.db",
    )

    # Render / PostgreSQL compatibility
    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql://",
            1,
        )

    SQLALCHEMY_DATABASE_URI = database_url

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