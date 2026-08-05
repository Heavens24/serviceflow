from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.message_service import (
    get_conversation,
    send_message,
)


message_bp = Blueprint(
    "messages",
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

    return result.get("status_code", failure_status)


# ==========================
# Send Message
# ==========================
@message_bp.route(
    "/messages",
    methods=["POST"],
)
@jwt_required()
def create_message():
    data = request.get_json(silent=True)

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

    status = get_result_status(
        result,
        success_status=201,
    )

    return result, status


# ==========================
# Get Conversation
# ==========================
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

    status = get_result_status(result)

    return result, status