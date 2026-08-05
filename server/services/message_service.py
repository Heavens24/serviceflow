from database import db
from models.message import Message
from models.service_request import ServiceRequest
from models.user import User
from services.notification_service import create_notification


MAX_MESSAGE_LENGTH = 2000

CHAT_ENABLED_STATUSES = {
    "accepted",
    "in_progress",
    "completed",
    "confirmed",
}


def parse_user_id(user_id):
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def user_to_summary(user):
    if not user:
        return None

    return {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role,
    }


def message_to_dict(message):
    return {
        "id": message.id,
        "service_request_id": message.service_request_id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "message": message.message,
        "created_at": message.created_at,
        "sender": user_to_summary(message.sender),
        "receiver": user_to_summary(message.receiver),
    }


def get_conversation_participants(
    service_request,
    user_id,
):
    """
    Validate access and return the current user and
    the other participant.
    """

    if not service_request.artisan_id:
        return {
            "success": False,
            "message": (
                "Messaging becomes available after an artisan "
                "accepts this request."
            ),
            "status_code": 409,
        }

    if service_request.status not in CHAT_ENABLED_STATUSES:
        return {
            "success": False,
            "message": (
                "Messaging is not available for this request."
            ),
            "status_code": 409,
        }

    if user_id == service_request.customer_id:
        receiver_id = service_request.artisan_id

    elif user_id == service_request.artisan_id:
        receiver_id = service_request.customer_id

    else:
        return {
            "success": False,
            "message": (
                "You are not part of this conversation."
            ),
            "status_code": 403,
        }

    sender = db.session.get(
        User,
        user_id,
    )

    receiver = db.session.get(
        User,
        receiver_id,
    )

    if not sender:
        return {
            "success": False,
            "message": "Sender not found.",
            "status_code": 404,
        }

    if not receiver:
        return {
            "success": False,
            "message": "Receiver not found.",
            "status_code": 404,
        }

    return {
        "success": True,
        "sender": sender,
        "receiver": receiver,
    }


def send_message(data, sender_id):
    sender_id = parse_user_id(sender_id)

    if sender_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    service_request_id = data.get(
        "service_request_id",
    )

    text = str(
        data.get("message", ""),
    ).strip()

    if service_request_id is None:
        return {
            "success": False,
            "message": "Service request ID is required.",
            "status_code": 400,
        }

    try:
        service_request_id = int(
            service_request_id,
        )
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": (
                "Service request ID must be valid."
            ),
            "status_code": 400,
        }

    if not text:
        return {
            "success": False,
            "message": "Message cannot be empty.",
            "status_code": 400,
        }

    if len(text) > MAX_MESSAGE_LENGTH:
        return {
            "success": False,
            "message": (
                f"Message cannot exceed "
                f"{MAX_MESSAGE_LENGTH} characters."
            ),
            "status_code": 400,
        }

    service_request = db.session.get(
        ServiceRequest,
        service_request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    participants = get_conversation_participants(
        service_request,
        sender_id,
    )

    if not participants["success"]:
        return participants

    sender = participants["sender"]
    receiver = participants["receiver"]

    new_message = Message(
        service_request_id=service_request.id,
        sender_id=sender.id,
        receiver_id=receiver.id,
        message=text,
    )

    try:
        db.session.add(new_message)

        create_notification(
            user_id=receiver.id,
            title="New message",
            message=(
                f'{sender.full_name} sent you a message '
                f'about "{service_request.title}".'
            ),
            notification_type="message_received",
            commit=False,
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": "Unable to send your message.",
            "status_code": 500,
        }

    return {
        "success": True,
        "message": "Message sent successfully.",
        "data": message_to_dict(new_message),
    }


def get_conversation(
    service_request_id,
    user_id,
):
    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    service_request = db.session.get(
        ServiceRequest,
        service_request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    participants = get_conversation_participants(
        service_request,
        user_id,
    )

    if not participants["success"]:
        return participants

    current_user = participants["sender"]
    other_user = participants["receiver"]

    messages = (
        Message.query
        .filter_by(
            service_request_id=service_request.id,
        )
        .order_by(
            Message.created_at.asc(),
            Message.id.asc(),
        )
        .all()
    )

    return {
        "success": True,
        "count": len(messages),
        "conversation": {
            "service_request": {
                "id": service_request.id,
                "title": service_request.title,
                "status": service_request.status,
                "customer_id": (
                    service_request.customer_id
                ),
                "artisan_id": (
                    service_request.artisan_id
                ),
            },
            "current_user": user_to_summary(
                current_user,
            ),
            "other_user": user_to_summary(
                other_user,
            ),
        },
        "messages": [
            message_to_dict(message)
            for message in messages
        ],
    }