from flask import Blueprint
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.notification_service import (
    get_notifications,
    get_unread_notification_count,
    mark_all_notifications_as_read,
    mark_notification_as_read,
)


notification_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api",
)


# ==========================
# Get Notifications
# ==========================
@notification_bp.route(
    "/notifications",
    methods=["GET"],
)
@jwt_required()
def notifications():
    user_id = get_jwt_identity()

    result = get_notifications(user_id)

    return result, 200


# ==========================
# Get Unread Count
# ==========================
@notification_bp.route(
    "/notifications/unread-count",
    methods=["GET"],
)
@jwt_required()
def unread_notification_count():
    user_id = get_jwt_identity()

    result = get_unread_notification_count(
        user_id,
    )

    return result, 200


# ==========================
# Mark One as Read
# ==========================
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

    if result["success"]:
        status = 200
    elif result["message"] == "Notification not found.":
        status = 404
    else:
        status = 403

    return result, status


# ==========================
# Mark All as Read
# ==========================
@notification_bp.route(
    "/notifications/read-all",
    methods=["PATCH"],
)
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()

    result = mark_all_notifications_as_read(
        user_id,
    )

    return result, 200