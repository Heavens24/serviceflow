from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.service_request_service import (
    accept_service_request,
    complete_service_request,
    confirm_service_request,
    create_service_request,
    get_all_service_requests,
    get_marketplace_jobs,
    get_my_jobs,
    get_my_requests,
    get_service_request,
    start_service_request,
)


service_request_bp = Blueprint(
    "service_requests",
    __name__,
    url_prefix="/api",
)


def get_result_status(
    result,
    success_status=200,
    failure_status=400,
):
    """
    Return the service-provided status code when available.
    """

    if result.get("success"):
        return success_status

    return result.get("status_code", failure_status)


# ==========================
# Create Service Request
# ==========================
@service_request_bp.route(
    "/service-requests",
    methods=["POST"],
)
@jwt_required()
def create_request():
    data = request.get_json(silent=True)

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    user_id = get_jwt_identity()

    result = create_service_request(
        data,
        user_id,
    )

    status = get_result_status(
        result,
        success_status=201,
    )

    return result, status


# ==========================
# Get Accessible Requests
# ==========================
@service_request_bp.route(
    "/service-requests",
    methods=["GET"],
)
@jwt_required()
def get_requests():
    user_id = get_jwt_identity()

    result = get_all_service_requests(
        user_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Get Marketplace Jobs
# ==========================
@service_request_bp.route(
    "/marketplace/jobs",
    methods=["GET"],
)
@jwt_required()
def marketplace_jobs():
    artisan_id = get_jwt_identity()

    result = get_marketplace_jobs(
        artisan_id,
    )

    status = get_result_status(
        result,
        failure_status=403,
    )

    return result, status


# ==========================
# Get Single Service Request
# ==========================
@service_request_bp.route(
    "/service-requests/<int:request_id>",
    methods=["GET"],
)
@jwt_required()
def get_request(request_id):
    user_id = get_jwt_identity()

    result = get_service_request(
        request_id,
        user_id,
    )

    status = get_result_status(
        result,
        failure_status=404,
    )

    return result, status


# ==========================
# Accept Service Request
# ==========================
@service_request_bp.route(
    "/service-requests/<int:request_id>/accept",
    methods=["PUT"],
)
@jwt_required()
def accept_request(request_id):
    artisan_id = get_jwt_identity()

    result = accept_service_request(
        request_id,
        artisan_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Start Service Request
# ==========================
@service_request_bp.route(
    "/service-requests/<int:request_id>/start",
    methods=["PUT"],
)
@jwt_required()
def start_request(request_id):
    artisan_id = get_jwt_identity()

    result = start_service_request(
        request_id,
        artisan_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Complete Service Request
# ==========================
@service_request_bp.route(
    "/service-requests/<int:request_id>/complete",
    methods=["PUT"],
)
@jwt_required()
def complete_request(request_id):
    artisan_id = get_jwt_identity()

    result = complete_service_request(
        request_id,
        artisan_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Confirm Service Request
# ==========================
@service_request_bp.route(
    "/service-requests/<int:request_id>/confirm",
    methods=["PUT"],
)
@jwt_required()
def confirm_request(request_id):
    customer_id = get_jwt_identity()

    result = confirm_service_request(
        request_id,
        customer_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Get Customer Requests
# ==========================
@service_request_bp.route(
    "/my/requests",
    methods=["GET"],
)
@jwt_required()
def my_requests():
    customer_id = get_jwt_identity()

    result = get_my_requests(
        customer_id,
    )

    status = get_result_status(result)

    return result, status


# ==========================
# Get Artisan Jobs
# ==========================
@service_request_bp.route(
    "/my/jobs",
    methods=["GET"],
)
@jwt_required()
def my_jobs():
    artisan_id = get_jwt_identity()

    result = get_my_jobs(
        artisan_id,
    )

    status = get_result_status(result)

    return result, status