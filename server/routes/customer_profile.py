from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.customer_profile_service import (
    create_or_update_profile,
    get_my_profile,
    get_profile,
)


customer_profile_bp = Blueprint(
    "customer_profiles",
    __name__,
    url_prefix="/api",
)


def get_result_status(
    result,
    success_status=200,
    failure_status=400,
):
    if result.get("success"):
        return success_status

    return result.get(
        "status_code",
        failure_status,
    )


# ==========================
# Create or Update Profile
# ==========================
@customer_profile_bp.route(
    "/customer-profile",
    methods=["POST", "PUT", "PATCH"],
)
@jwt_required()
def save_profile():
    data = request.get_json(silent=True)

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

    status = get_result_status(result)

    return result, status


# ==========================
# Get Logged-In Profile
# ==========================
@customer_profile_bp.route(
    "/customer-profile",
    methods=["GET"],
)
@jwt_required()
def my_profile():
    user_id = get_jwt_identity()

    result = get_my_profile(user_id)

    status = get_result_status(
        result,
        failure_status=404,
    )

    return result, status


# ==========================
# Get Public Profile
# ==========================
@customer_profile_bp.route(
    "/customer-profiles/<int:user_id>",
    methods=["GET"],
)
@jwt_required()
def customer_profile(user_id):
    result = get_profile(user_id)

    status = get_result_status(
        result,
        failure_status=404,
    )

    return result, status