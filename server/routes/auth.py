from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User
from services.auth_service import (
    register_user,
    login_user,
)

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth",
)


# ==========================
# Register
# ==========================
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


# ==========================
# Login
# ==========================
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


# ==========================
# Current Logged-in User
# ==========================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def current_user():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found."
        }, 404

    return {
        "success": True,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "role": user.role,
        },
    }, 200