from database import db
from models.review import Review
from models.service_request import ServiceRequest
from models.user import User
from services.notification_service import create_notification


def review_to_dict(review):
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "customer_id": review.customer_id,
        "artisan_id": review.artisan_id,
        "service_request_id": review.service_request_id,
        "created_at": review.created_at,
    }


def create_review(data, customer_id):
    rating = data.get("rating")
    comment = data.get("comment", "").strip()
    service_request_id = data.get("service_request_id")

    if rating is None:
        return {
            "success": False,
            "message": "Rating is required.",
        }

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": "Rating must be a number.",
        }

    if rating < 1 or rating > 5:
        return {
            "success": False,
            "message": "Rating must be between 1 and 5.",
        }

    if not service_request_id:
        return {
            "success": False,
            "message": "Service request ID is required.",
        }

    try:
        service_request_id = int(service_request_id)
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": "Service request ID must be valid.",
        }

    customer = User.query.get(int(customer_id))

    if not customer:
        return {
            "success": False,
            "message": "Customer not found.",
        }

    if customer.role != "customer":
        return {
            "success": False,
            "message": "Only customers can submit reviews.",
        }

    service_request = ServiceRequest.query.get(
        service_request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    if service_request.customer_id != customer.id:
        return {
            "success": False,
            "message": "You do not own this service request.",
        }

    if service_request.status != "confirmed":
        return {
            "success": False,
            "message": "Only confirmed jobs can be reviewed.",
        }

    if not service_request.artisan_id:
        return {
            "success": False,
            "message": (
                "This service request has no assigned artisan."
            ),
        }

    existing_review = Review.query.filter_by(
        service_request_id=service_request.id,
    ).first()

    if existing_review:
        return {
            "success": False,
            "message": (
                "You have already reviewed this service request."
            ),
        }

    review = Review(
        rating=rating,
        comment=comment,
        customer_id=service_request.customer_id,
        artisan_id=service_request.artisan_id,
        service_request_id=service_request.id,
    )

    try:
        db.session.add(review)

        create_notification(
            user_id=service_request.artisan_id,
            title="New review received",
            message=(
                f'You received a {rating}-star review for '
                f'"{service_request.title}".'
            ),
            notification_type="review_received",
            commit=False,
        )

        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": "Unable to submit your review.",
        }

    return {
        "success": True,
        "message": "Review submitted successfully.",
        "review": review_to_dict(review),
    }


def get_review(review_id):
    review = Review.query.get(review_id)

    if not review:
        return {
            "success": False,
            "message": "Review not found.",
        }

    return {
        "success": True,
        "review": review_to_dict(review),
    }


def get_artisan_reviews(artisan_id):
    artisan = User.query.get(int(artisan_id))

    if not artisan:
        return {
            "success": False,
            "message": "Artisan not found.",
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": "User is not an artisan.",
        }

    reviews = (
        Review.query
        .filter_by(artisan_id=artisan.id)
        .order_by(Review.created_at.desc())
        .all()
    )

    average_rating = 0

    if reviews:
        average_rating = round(
            sum(review.rating for review in reviews)
            / len(reviews),
            2,
        )

    return {
        "success": True,
        "artisan_id": artisan.id,
        "average_rating": average_rating,
        "total_reviews": len(reviews),
        "reviews": [
            review_to_dict(review)
            for review in reviews
        ],
    }