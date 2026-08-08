import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from sqlalchemy import text

from config import Config
from database import db
from models import (
    ArtisanProfile,
    CustomerProfile,
    Message,
    Notification,
    Review,
    ServiceRequest,
    Transaction,
    User,
    Wallet,
    Withdrawal,
)

# ==========================
# Import Routes
# ==========================

from routes.admin import admin_bp
from routes.artisan_profile import (
    artisan_profile_bp,
)
from routes.auth import auth_bp
from routes.customer_profile import (
    customer_profile_bp,
)
from routes.dashboard import dashboard_bp
from routes.message import message_bp
from routes.notification import notification_bp
from routes.review import review_bp
from routes.service_request import (
    service_request_bp,
)
from routes.wallet import wallet_bp


# ==========================
# Create Flask App
# ==========================

app = Flask(__name__)
app.config.from_object(Config)


# ==========================
# Configure CORS
# ==========================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": app.config[
                "CORS_ORIGINS"
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization",
            ],
            "expose_headers": [
                "Content-Type",
                "Authorization",
            ],
            "supports_credentials": False,
            "max_age": 86400,
        },
    },
)


# ==========================
# Initialize Extensions
# ==========================

db.init_app(app)

jwt = JWTManager(app)

migrate = Migrate(
    app,
    db,
)


# ==========================
# JWT Error Responses
# ==========================

@jwt.unauthorized_loader
def missing_token_callback(
    error_message,
):
    return {
        "success": False,
        "message": (
            "Authentication token is required."
        ),
        "error": error_message,
    }, 401


@jwt.invalid_token_loader
def invalid_token_callback(
    error_message,
):
    return {
        "success": False,
        "message": (
            "The authentication token is invalid."
        ),
        "error": error_message,
    }, 422


@jwt.expired_token_loader
def expired_token_callback(
    jwt_header,
    jwt_payload,
):
    return {
        "success": False,
        "message": (
            "Your session has expired. "
            "Please log in again."
        ),
    }, 401


@jwt.revoked_token_loader
def revoked_token_callback(
    jwt_header,
    jwt_payload,
):
    return {
        "success": False,
        "message": (
            "This authentication token "
            "has been revoked."
        ),
    }, 401


@jwt.needs_fresh_token_loader
def fresh_token_required_callback(
    jwt_header,
    jwt_payload,
):
    return {
        "success": False,
        "message": (
            "A fresh authentication token "
            "is required."
        ),
    }, 401


@jwt.token_verification_failed_loader
def token_verification_failed_callback(
    jwt_header,
    jwt_payload,
):
    return {
        "success": False,
        "message": (
            "Authentication-token "
            "verification failed."
        ),
    }, 401


# ==========================
# Register Blueprints
# ==========================

app.register_blueprint(
    auth_bp,
)

app.register_blueprint(
    service_request_bp,
)

app.register_blueprint(
    review_bp,
)

app.register_blueprint(
    message_bp,
)

app.register_blueprint(
    artisan_profile_bp,
)

app.register_blueprint(
    customer_profile_bp,
)

app.register_blueprint(
    notification_bp,
)

app.register_blueprint(
    dashboard_bp,
)

app.register_blueprint(
    admin_bp,
)

app.register_blueprint(
    wallet_bp,
)


# ==========================
# Home Route
# ==========================

@app.route(
    "/",
    methods=["GET"],
)
def home():
    return {
        "message": (
            "Welcome to the ServiceFlow API"
        ),
        "status": "running",
        "environment": app.config.get(
            "FLASK_ENV",
            "unknown",
        ),
    }, 200


# ==========================
# Health Check
# ==========================

@app.route(
    "/health",
    methods=["GET"],
)
def health():
    try:
        db.session.execute(
            text("SELECT 1"),
        )

        return {
            "status": "healthy",
            "database": "connected",
        }, 200

    except Exception:
        db.session.rollback()

        return {
            "status": "unhealthy",
            "database": "disconnected",
        }, 503


# ==========================
# API Not Found Handler
# ==========================

@app.errorhandler(404)
def not_found(error):
    return {
        "success": False,
        "message": (
            "The requested resource "
            "was not found."
        ),
    }, 404


# ==========================
# Method Not Allowed Handler
# ==========================

@app.errorhandler(405)
def method_not_allowed(error):
    return {
        "success": False,
        "message": (
            "This request method "
            "is not allowed."
        ),
    }, 405


# ==========================
# Request Too Large Handler
# ==========================

@app.errorhandler(413)
def request_too_large(error):
    return {
        "success": False,
        "message": (
            "The submitted request "
            "is too large."
        ),
    }, 413


# ==========================
# Internal Server Error
# ==========================

@app.errorhandler(500)
def internal_server_error(error):
    db.session.rollback()

    return {
        "success": False,
        "message": (
            "An internal server error occurred."
        ),
    }, 500


# ==========================
# Run Application Locally
# ==========================

if __name__ == "__main__":
    port = int(
        os.getenv(
            "PORT",
            "5000",
        ),
    )

    app.run(
        debug=app.config.get(
            "DEBUG",
            False,
        ),
        host="0.0.0.0",
        port=port,
    )