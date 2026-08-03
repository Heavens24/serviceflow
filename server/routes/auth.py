from flask import Blueprint, request

from services.auth_service import (
    register_user,
    login_user,
)

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth",
)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    result = register_user(data)

    status = 201 if result["success"] else 400

    return result, status


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    result = login_user(data)

    status = 200 if result["success"] else 401

    return result, status