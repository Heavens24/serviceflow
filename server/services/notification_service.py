from database import db
from models.notification import Notification
from models.user import User


def notification_to_dict(notification):
    return {
        "id": notification.id,
        "user_id": notification.user_id,
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
    notification_type="general",
    commit=True,
):
    """
    Create a notification.

    When commit=False, the notification is added to the current
    transaction but is not committed immediately. This allows
    service-request updates and notifications to be committed
    together safely.
    """

    user = User.query.get(int(user_id))

    if not user:
        return None

    notification = Notification(
        user_id=user.id,
        title=str(title).strip(),
        message=str(message).strip(),
        notification_type=(
            str(notification_type).strip() or "general"
        ),
        is_read=False,
    )

    db.session.add(notification)

    if commit:
        db.session.commit()
    else:
        db.session.flush()

    return notification


def get_notifications(user_id):
    user_id = int(user_id)

    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    unread_count = sum(
        1
        for notification in notifications
        if not notification.is_read
    )

    return {
        "success": True,
        "count": len(notifications),
        "unread_count": unread_count,
        "notifications": [
            notification_to_dict(notification)
            for notification in notifications
        ],
    }


def get_unread_notification_count(user_id):
    unread_count = Notification.query.filter_by(
        user_id=int(user_id),
        is_read=False,
    ).count()

    return {
        "success": True,
        "unread_count": unread_count,
    }


def mark_notification_as_read(
    notification_id,
    user_id,
):
    notification = Notification.query.get(
        notification_id,
    )

    if not notification:
        return {
            "success": False,
            "message": "Notification not found.",
        }

    if notification.user_id != int(user_id):
        return {
            "success": False,
            "message": (
                "You are not authorized to update this notification."
            ),
        }

    if not notification.is_read:
        notification.is_read = True
        db.session.commit()

    return {
        "success": True,
        "message": "Notification marked as read.",
        "notification": notification_to_dict(
            notification,
        ),
    }


def mark_all_notifications_as_read(user_id):
    user_id = int(user_id)

    unread_notifications = (
        Notification.query
        .filter_by(
            user_id=user_id,
            is_read=False,
        )
        .all()
    )

    for notification in unread_notifications:
        notification.is_read = True

    if unread_notifications:
        db.session.commit()

    return {
        "success": True,
        "message": "All notifications marked as read.",
        "updated_count": len(unread_notifications),
    }