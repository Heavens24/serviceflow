from sqlalchemy import func

from database import db
from models.notification import Notification
from models.review import Review
from models.service_request import ServiceRequest
from models.user import User


def get_dashboard(user_id):
    """
    Return dashboard statistics based on the logged-in user's role.
    """

    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    # ==========================================
    # Customer Dashboard
    # ==========================================
    if user.role == "customer":
        total_requests = ServiceRequest.query.filter_by(
            customer_id=user.id,
        ).count()

        # New service requests use the internal status "open".
        # The API still returns "pending_requests" as the
        # user-friendly dashboard label.
        pending_requests = ServiceRequest.query.filter_by(
            customer_id=user.id,
            status="open",
        ).count()

        in_progress = ServiceRequest.query.filter(
            ServiceRequest.customer_id == user.id,
            ServiceRequest.status.in_(
                [
                    "accepted",
                    "in_progress",
                ]
            ),
        ).count()

        completed = ServiceRequest.query.filter_by(
            customer_id=user.id,
            status="confirmed",
        ).count()

        unread_notifications = Notification.query.filter_by(
            user_id=user.id,
            is_read=False,
        ).count()

        return {
            "success": True,
            "dashboard": {
                "role": "customer",
                "total_requests": total_requests,
                "pending_requests": pending_requests,
                "in_progress": in_progress,
                "completed": completed,
                "unread_notifications": unread_notifications,
            },
        }

    # ==========================================
    # Artisan Dashboard
    # ==========================================
    jobs_accepted = ServiceRequest.query.filter_by(
        artisan_id=user.id,
    ).count()

    jobs_in_progress = ServiceRequest.query.filter(
        ServiceRequest.artisan_id == user.id,
        ServiceRequest.status.in_(
            [
                "accepted",
                "in_progress",
            ]
        ),
    ).count()

    jobs_completed = ServiceRequest.query.filter_by(
        artisan_id=user.id,
        status="confirmed",
    ).count()

    total_reviews = Review.query.filter_by(
        artisan_id=user.id,
    ).count()

    average_rating = (
        db.session.query(func.avg(Review.rating))
        .filter(Review.artisan_id == user.id)
        .scalar()
    )

    if average_rating is None:
        average_rating = 0

    unread_notifications = Notification.query.filter_by(
        user_id=user.id,
        is_read=False,
    ).count()

    return {
        "success": True,
        "dashboard": {
            "role": "artisan",
            "jobs_accepted": jobs_accepted,
            "jobs_in_progress": jobs_in_progress,
            "jobs_completed": jobs_completed,
            "average_rating": round(
                float(average_rating),
                2,
            ),
            "total_reviews": total_reviews,
            "unread_notifications": unread_notifications,
        },
    }