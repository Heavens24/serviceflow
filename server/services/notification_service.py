from database import db
from models.notification import Notification


def notification_to_dict(notification):
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }


def create_notification(
    user_id,
    title,
    message,
    notification_type,
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    db.session.add(notification)
    db.session.commit()

    return notification


def get_notifications(user_id):
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(notifications),
        "notifications": [
            notification_to_dict(notification)
            for notification in notifications
        ],
    }


def mark_notification_as_read(
    notification_id,
    user_id,
):
    notification = Notification.query.get(notification_id)

    if not notification:
        return {
            "success": False,
            "message": "Notification not found.",
        }

    if notification.user_id != int(user_id):
        return {
            "success": False,
            "message": "You are not authorized to update this notification.",
        }

    notification.is_read = True

    db.session.commit()

    return {
        "success": True,
        "message": "Notification marked as read.",
        "notification": notification_to_dict(notification),
    }