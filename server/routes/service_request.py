from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.service_request_service import (
    create_service_request,
    get_all_service_requests,
    get_service_request,
    accept_service_request,
    start_service_request,
    complete_service_request,
    confirm_service_request,
    get_my_requests,
    get_my_jobs,
)

service_request_bp = Blueprint(
    "service_requests",
    __name__,
    url_prefix="/api",
)


@service_request_bp.route("/service-requests", methods=["POST"])
@jwt_required()
def create_request():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    customer_id = get_jwt_identity()

    result = create_service_request(data, customer_id)

    status = 201 if result["success"] else 400

    return result, status


@service_request_bp.route("/service-requests", methods=["GET"])
@jwt_required()
def get_requests():
    result = get_all_service_requests()
    return result, 200


@service_request_bp.route("/service-requests/<int:request_id>", methods=["GET"])
@jwt_required()
def get_request(request_id):
    result = get_service_request(request_id)

    status = 200 if result["success"] else 404

    return result, status


@service_request_bp.route("/service-requests/<int:request_id>/accept", methods=["PUT"])
@jwt_required()
def accept_request(request_id):
    artisan_id = get_jwt_identity()

    result = accept_service_request(
        request_id,
        artisan_id,
    )

    status = 200 if result["success"] else 400

    return result, status


@service_request_bp.route("/service-requests/<int:request_id>/start", methods=["PUT"])
@jwt_required()
def start_request(request_id):
    artisan_id = get_jwt_identity()

    result = start_service_request(
        request_id,
        artisan_id,
    )

    status = 200 if result["success"] else 400

    return result, status


@service_request_bp.route("/service-requests/<int:request_id>/complete", methods=["PUT"])
@jwt_required()
def complete_request(request_id):
    artisan_id = get_jwt_identity()

    result = complete_service_request(
        request_id,
        artisan_id,
    )

    status = 200 if result["success"] else 400

    return result, status


@service_request_bp.route("/service-requests/<int:request_id>/confirm", methods=["PUT"])
@jwt_required()
def confirm_request(request_id):
    customer_id = get_jwt_identity()

    result = confirm_service_request(
        request_id,
        customer_id,
    )

    status = 200 if result["success"] else 400

    return result, status


@service_request_bp.route("/my/requests", methods=["GET"])
@jwt_required()
def my_requests():
    customer_id = get_jwt_identity()

    result = get_my_requests(customer_id)

    return result, 200


@service_request_bp.route("/my/jobs", methods=["GET"])
@jwt_required()
def my_jobs():
    artisan_id = get_jwt_identity()

    result = get_my_jobs(artisan_id)

    status = 200 if result["success"] else 400

    return result, status