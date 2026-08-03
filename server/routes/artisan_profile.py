from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.artisan_profile_service import (
    create_or_update_profile,
    get_my_profile,
    get_all_profiles,
    get_profile,
)

artisan_profile_bp = Blueprint(
    "artisan_profiles",
    __name__,
    url_prefix="/api",
)


@artisan_profile_bp.route("/artisan-profile", methods=["POST"])
@jwt_required()
def save_profile():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    user_id = get_jwt_identity()

    result = create_or_update_profile(
        data,
        user_id,
    )

    status = 200 if result["success"] else 400

    return result, status


@artisan_profile_bp.route("/artisan-profile", methods=["GET"])
@jwt_required()
def my_profile():
    user_id = get_jwt_identity()

    result = get_my_profile(user_id)

    status = 200 if result["success"] else 404

    return result, status


@artisan_profile_bp.route("/artisan-profiles", methods=["GET"])
@jwt_required()
def artisan_profiles():
    result = get_all_profiles()

    return result, 200


@artisan_profile_bp.route("/artisan-profiles/<int:user_id>", methods=["GET"])
@jwt_required()
def artisan_profile(user_id):
    result = get_profile(user_id)

    status = 200 if result["success"] else 404

    return result, status