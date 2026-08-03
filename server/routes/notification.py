from flask import Blueprint
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
)

from services.notification_service import (
    get_notifications,
    mark_notification_as_read,
)

notification_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api",
)


@notification_bp.route(
    "/notifications",
    methods=["GET"],
)
@jwt_required()
def notifications():
    user_id = get_jwt_identity()

    return get_notifications(user_id), 200


@notification_bp.route(
    "/notifications/<int:notification_id>/read",
    methods=["PATCH"],
)
@jwt_required()
def mark_read(notification_id):
    user_id = get_jwt_identity()

    result = mark_notification_as_read(
        notification_id,
        user_id,
    )

    status = 200 if result["success"] else 404

    return result, status