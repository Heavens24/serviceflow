import os
from datetime import timedelta

from dotenv import load_dotenv


# ==========================
# Load Environment Variables
# ==========================

load_dotenv()


# ==========================
# Environment Helpers
# ==========================

def get_boolean_environment_value(
    variable_name,
    default=False,
):
    """
    Convert an environment-variable string
    into a Boolean.
    """

    default_value = (
        "true"
        if default
        else "false"
    )

    return (
        os.getenv(
            variable_name,
            default_value,
        )
        .strip()
        .lower()
        in {
            "1",
            "true",
            "yes",
            "on",
        }
    )


def get_integer_environment_value(
    variable_name,
    default,
):
    """
    Read an integer environment variable
    safely.
    """

    raw_value = os.getenv(
        variable_name,
        str(default),
    )

    try:
        return int(raw_value)
    except (
        TypeError,
        ValueError,
    ):
        return default


def get_cors_origins():
    """
    Build the list of allowed frontend
    origins.

    Multiple origins may be supplied through
    CORS_ORIGINS as a comma-separated list.
    """

    default_origins = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174"
    )

    raw_origins = os.getenv(
        "CORS_ORIGINS",
        default_origins,
    )

    origins = [
        origin.strip().rstrip("/")
        for origin in raw_origins.split(",")
        if origin.strip()
    ]

    frontend_url = (
        os.getenv(
            "FRONTEND_URL",
            "",
        )
        .strip()
        .rstrip("/")
    )

    if (
        frontend_url
        and frontend_url not in origins
    ):
        origins.append(
            frontend_url,
        )

    return origins


class Config:
    # ==========================
    # Application Environment
    # ==========================

    FLASK_ENV = os.getenv(
        "FLASK_ENV",
        "development",
    )

    DEBUG = (
        get_boolean_environment_value(
            "FLASK_DEBUG",
            default=(
                FLASK_ENV
                == "development"
            ),
        )
    )

    TESTING = (
        get_boolean_environment_value(
            "TESTING",
            default=False,
        )
    )

    # ==========================
    # Security
    # ==========================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        (
            "serviceflow-"
            "development-secret-key"
        ),
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        (
            "serviceflow-development-"
            "jwt-secret-key"
        ),
    )

    JWT_ACCESS_TOKEN_EXPIRES = (
        timedelta(
            hours=(
                get_integer_environment_value(
                    "JWT_ACCESS_TOKEN_HOURS",
                    24,
                )
            ),
        )
    )

    JWT_TOKEN_LOCATION = [
        "headers",
    ]

    JWT_HEADER_NAME = (
        "Authorization"
    )

    JWT_HEADER_TYPE = "Bearer"

    # ==========================
    # Database
    # ==========================

    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite:///serviceflow.db",
    )

    # ==========================
    # PostgreSQL / Supabase /
    # Render Compatibility
    # ==========================

    if database_url.startswith(
        "postgres://",
    ):
        database_url = (
            database_url.replace(
                "postgres://",
                "postgresql+psycopg://",
                1,
            )
        )

    elif database_url.startswith(
        "postgresql://",
    ):
        database_url = (
            database_url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )
        )

    SQLALCHEMY_DATABASE_URI = (
        database_url
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = (
        False
    )

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # ==========================
    # Frontend / CORS
    # ==========================

    FRONTEND_URL = (
        os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173",
        )
        .strip()
        .rstrip("/")
    )

    CORS_ORIGINS = (
        get_cors_origins()
    )

    # ==========================
    # ServiceFlow Finance
    # ==========================

    SERVICEFLOW_COMMISSION_PERCENT = (
        os.getenv(
            "SERVICEFLOW_COMMISSION_PERCENT",
            "10",
        )
        .strip()
    )

    FINANCE_CURRENCY = (
        os.getenv(
            "FINANCE_CURRENCY",
            "ZAR",
        )
        .strip()
        .upper()
    )

    MINIMUM_WITHDRAWAL_AMOUNT = (
        os.getenv(
            "MINIMUM_WITHDRAWAL_AMOUNT",
            "50.00",
        )
        .strip()
    )

    # ==========================
    # Paystack
    # ==========================

    PAYSTACK_ENABLED = (
        get_boolean_environment_value(
            "PAYSTACK_ENABLED",
            default=False,
        )
    )

    PAYSTACK_SECRET_KEY = (
        os.getenv(
            "PAYSTACK_SECRET_KEY",
            "",
        )
        .strip()
    )

    PAYSTACK_PUBLIC_KEY = (
        os.getenv(
            "PAYSTACK_PUBLIC_KEY",
            "",
        )
        .strip()
    )

    PAYSTACK_BASE_URL = (
        os.getenv(
            "PAYSTACK_BASE_URL",
            "https://api.paystack.co",
        )
        .strip()
        .rstrip("/")
    )

    PAYSTACK_CALLBACK_URL = (
        os.getenv(
            "PAYSTACK_CALLBACK_URL",
            "",
        )
        .strip()
    )

    PAYSTACK_WEBHOOK_SECRET = (
        os.getenv(
            "PAYSTACK_WEBHOOK_SECRET",
            "",
        )
        .strip()
    )

    # ==========================
    # JSON Responses
    # ==========================

    JSON_SORT_KEYS = False