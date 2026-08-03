from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.message_service import (
    send_message,
    get_conversation,
)

message_bp = Blueprint(
    "messages",
    __name__,
    url_prefix="/api",
)


@message_bp.route("/messages", methods=["POST"])
@jwt_required()
def create_message():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    sender_id = get_jwt_identity()

    result = send_message(
        data,
        sender_id,
    )

    status = 201 if result["success"] else 400

    return result, status


@message_bp.route(
    "/service-requests/<int:service_request_id>/messages",
    methods=["GET"],
)
@jwt_required()
def conversation(service_request_id):
    user_id = get_jwt_identity()

    result = get_conversation(
        service_request_id,
        user_id,
    )

    status = 200 if result["success"] else 403

    return result, status