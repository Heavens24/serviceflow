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


def normalize_database_url(
    database_url,
):
    database_url = (
        database_url
        or ""
    ).strip()

    if database_url.startswith(
        "postgres://",
    ):
        return database_url.replace(
            "postgres://",
            "postgresql+psycopg://",
            1,
        )

    if database_url.startswith(
        "postgresql://",
    ):
        return database_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1,
        )

    return database_url


class Config:
    # ==========================
    # Application Environment
    # ==========================

    APP_ENV = (
        os.getenv(
            "APP_ENV",
            os.getenv(
                "FLASK_ENV",
                "development",
            ),
        )
        .strip()
        .lower()
    )

    FLASK_ENV = APP_ENV

    IS_PRODUCTION = (
        APP_ENV == "production"
    )

    IS_DEVELOPMENT = (
        APP_ENV == "development"
    )

    TESTING = (
        get_boolean_environment_value(
            "TESTING",
            default=False,
        )
    )

    DEBUG = (
        False
        if IS_PRODUCTION
        else get_boolean_environment_value(
            "FLASK_DEBUG",
            default=IS_DEVELOPMENT,
        )
    )

    # ==========================
    # Application Security
    # ==========================

    SECRET_KEY = (
        os.getenv(
            "SECRET_KEY",
            "",
        )
        .strip()
    )

    JWT_SECRET_KEY = (
        os.getenv(
            "JWT_SECRET_KEY",
            "",
        )
        .strip()
    )

    # Development-only fallback secrets.
    if not SECRET_KEY:
        SECRET_KEY = (
            "serviceflow-development-secret-key"
        )

    if not JWT_SECRET_KEY:
        JWT_SECRET_KEY = (
            "serviceflow-development-jwt-secret-key"
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

    JWT_HEADER_TYPE = (
        "Bearer"
    )

    # Do not expose detailed JWT errors
    # from production internals.
    JWT_ERROR_MESSAGE_KEY = (
        "message"
    )

    # ==========================
    # Request Limits
    # ==========================

    MAX_CONTENT_LENGTH = (
        get_integer_environment_value(
            "MAX_CONTENT_LENGTH_MB",
            10,
        )
        * 1024
        * 1024
    )

    # ==========================
    # Database
    # ==========================

    database_url = (
        os.getenv(
            "DATABASE_URL",
            "sqlite:///serviceflow.db",
        )
        .strip()
    )

    SQLALCHEMY_DATABASE_URI = (
        normalize_database_url(
            database_url,
        )
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
    # Reverse Proxy
    # ==========================

    TRUST_PROXY = (
        get_boolean_environment_value(
            "TRUST_PROXY",
            default=IS_PRODUCTION,
        )
    )

    # ==========================
    # HTTPS / Cookies
    # ==========================

    PREFERRED_URL_SCHEME = (
        "https"
        if IS_PRODUCTION
        else "http"
    )

    SESSION_COOKIE_SECURE = (
        IS_PRODUCTION
    )

    SESSION_COOKIE_HTTPONLY = True

    SESSION_COOKIE_SAMESITE = (
        "Lax"
    )

    # ==========================
    # Security Headers
    # ==========================

    ENABLE_SECURITY_HEADERS = (
        get_boolean_environment_value(
            "ENABLE_SECURITY_HEADERS",
            default=True,
        )
    )

    ENABLE_HSTS = (
        get_boolean_environment_value(
            "ENABLE_HSTS",
            default=IS_PRODUCTION,
        )
    )

    HSTS_MAX_AGE = (
        get_integer_environment_value(
            "HSTS_MAX_AGE",
            31536000,
        )
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

    PAYSTACK_ALLOW_TEST_MODE_IN_PRODUCTION = (
        get_boolean_environment_value(
            "PAYSTACK_ALLOW_TEST_MODE_IN_PRODUCTION",
            default=False,
        )
    )

    # ==========================
    # JSON
    # ==========================

    JSON_SORT_KEYS = False


# ==========================
# Production Validation
# ==========================

def validate_production_config(
    config,
):
    """
    Raise a clear startup error when ServiceFlow
    is started with unsafe production settings.
    """

    if not config.IS_PRODUCTION:
        return

    unsafe_secret_values = {
        "",
        "replace-me",
        "replace-me-with-a-strong-secret",
        (
            "serviceflow-development-"
            "secret-key"
        ),
    }

    unsafe_jwt_values = {
        "",
        "replace-me",
        "replace-me-with-a-strong-jwt-secret",
        (
            "serviceflow-development-"
            "jwt-secret-key"
        ),
    }

    if (
        config.SECRET_KEY
        in unsafe_secret_values
    ):
        raise RuntimeError(
            "Production SECRET_KEY is missing "
            "or still uses a development value."
        )

    if (
        config.JWT_SECRET_KEY
        in unsafe_jwt_values
    ):
        raise RuntimeError(
            "Production JWT_SECRET_KEY is "
            "missing or unsafe."
        )

    if len(config.SECRET_KEY) < 32:
        raise RuntimeError(
            "Production SECRET_KEY should be "
            "at least 32 characters long."
        )

    if len(config.JWT_SECRET_KEY) < 32:
        raise RuntimeError(
            "Production JWT_SECRET_KEY should "
            "be at least 32 characters long."
        )

    database_uri = (
        config.SQLALCHEMY_DATABASE_URI
        or ""
    ).lower()

    if database_uri.startswith(
        "sqlite:"
    ):
        raise RuntimeError(
            "Production must not use the local "
            "SQLite ServiceFlow database."
        )

    if not config.FRONTEND_URL.startswith(
        "https://"
    ):
        raise RuntimeError(
            "Production FRONTEND_URL must use HTTPS."
        )

    for origin in config.CORS_ORIGINS:
        if not origin.startswith(
            "https://"
        ):
            raise RuntimeError(
                "Production CORS_ORIGINS must "
                "contain HTTPS origins only."
            )

    if config.DEBUG:
        raise RuntimeError(
            "DEBUG must be disabled in production."
        )

    if config.PAYSTACK_ENABLED:
        secret_key = (
            config.PAYSTACK_SECRET_KEY
            or ""
        )

        public_key = (
            config.PAYSTACK_PUBLIC_KEY
            or ""
        )

        if not secret_key:
            raise RuntimeError(
                "PAYSTACK_SECRET_KEY is required "
                "when Paystack is enabled."
            )

        if not public_key:
            raise RuntimeError(
                "PAYSTACK_PUBLIC_KEY is required "
                "when Paystack is enabled."
            )

        using_test_keys = (
            secret_key.startswith(
                "sk_test_"
            )
            or public_key.startswith(
                "pk_test_"
            )
        )

        if (
            using_test_keys
            and not (
                config
                .PAYSTACK_ALLOW_TEST_MODE_IN_PRODUCTION
            )
        ):
            raise RuntimeError(
                "Paystack test keys cannot be used "
                "in production unless explicitly "
                "allowed."
            )