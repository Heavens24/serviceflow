from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from models.user import User
from services.auth_service import (
    login_user,
    register_user,
)


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth",
)


# ==========================
# Register
# ==========================
@auth_bp.route(
    "/register",
    methods=["POST"],
)
def register():
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    result, status_code = register_user(
        data,
    )

    return result, status_code


# ==========================
# Login
# ==========================
@auth_bp.route(
    "/login",
    methods=["POST"],
)
def login():
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    result, status_code = login_user(
        data,
    )

    return result, status_code


# ==========================
# Current Logged-in User
# ==========================
@auth_bp.route(
    "/me",
    methods=["GET"],
)
@jwt_required()
def current_user():
    user_id = get_jwt_identity()

    try:
        normalized_user_id = int(
            user_id,
        )
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": (
                "The authentication identity "
                "is invalid."
            ),
        }, 401

    user = User.query.get(
        normalized_user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }, 404

    if user.is_banned:
        return {
            "success": False,
            "message": (
                "This account has been banned. "
                "Please contact ServiceFlow support."
            ),
            "account_status": user.status,
        }, 403

    if user.is_suspended:
        return {
            "success": False,
            "message": (
                "This account is currently suspended. "
                "Please contact ServiceFlow support."
            ),
            "account_status": user.status,
        }, 403

    if not user.is_active:
        return {
            "success": False,
            "message": (
                "This account is not currently active."
            ),
            "account_status": user.status,
        }, 403

    return {
        "success": True,
        "user": user.to_dict(),
    }, 200