from database import db
from models.message import Message
from models.service_request import ServiceRequest
from services.notification_service import create_notification


def message_to_dict(message):
    return {
        "id": message.id,
        "service_request_id": message.service_request_id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "message": message.message,
        "created_at": message.created_at,
    }


def send_message(data, sender_id):
    service_request_id = data.get("service_request_id")
    text = data.get("message", "").strip()

    if not service_request_id:
        return {
            "success": False,
            "message": "Service request ID is required.",
        }

    if not text:
        return {
            "success": False,
            "message": "Message cannot be empty.",
        }

    job = ServiceRequest.query.get(service_request_id)

    if not job:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    sender_id = int(sender_id)

    # ==========================================
    # Determine who receives the message
    # ==========================================

    if sender_id == job.customer_id:

        if not job.artisan_id:
            return {
                "success": False,
                "message": "No artisan has accepted this request yet.",
            }

        receiver_id = job.artisan_id

    elif sender_id == job.artisan_id:

        receiver_id = job.customer_id

    else:
        return {
            "success": False,
            "message": "You are not part of this conversation.",
        }

    # ==========================================
    # Save the message
    # ==========================================

    new_message = Message(
        service_request_id=job.id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=text,
    )

    db.session.add(new_message)
    db.session.commit()

    # ==========================================
    # Create notification for receiver
    # ==========================================

    create_notification(
        user_id=receiver_id,
        title="New Message",
        message=f"You have received a new message regarding Service Request #{job.id}.",
        notification_type="message",
    )

    return {
        "success": True,
        "message": "Message sent successfully.",
        "data": message_to_dict(new_message),
    }


def get_conversation(service_request_id, user_id):

    job = ServiceRequest.query.get(service_request_id)

    if not job:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    user_id = int(user_id)

    if user_id not in [job.customer_id, job.artisan_id]:
        return {
            "success": False,
            "message": "You are not authorized to view this conversation.",
        }

    messages = (
        Message.query
        .filter_by(service_request_id=job.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return {
        "success": True,
        "count": len(messages),
        "messages": [
            message_to_dict(msg)
            for msg in messages
        ],
    }