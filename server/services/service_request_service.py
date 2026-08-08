from datetime import datetime

from sqlalchemy import or_

from database import db
from models.service_request import ServiceRequest
from models.user import User
from services.notification_service import create_notification
from services.wallet_service import release_confirmed_job_earnings


# ==========================
# Helper Functions
# ==========================
def parse_user_id(user_id):
    """
    Convert a JWT identity into an integer user ID.

    Returns None when the identity is invalid.
    """

    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def service_request_to_dict(service_request):
    """
    Convert a service request into a JSON-compatible dictionary.

    Include the related review when one exists so the frontend
    can determine whether the customer has already reviewed it.
    """

    review_data = None

    if service_request.review:
        review_data = {
            "id": service_request.review.id,
            "rating": service_request.review.rating,
            "comment": service_request.review.comment,
            "customer_id": service_request.review.customer_id,
            "artisan_id": service_request.review.artisan_id,
            "service_request_id": (
                service_request.review.service_request_id
            ),
            "created_at": service_request.review.created_at,
        }

    return {
        "id": service_request.id,
        "title": service_request.title,
        "description": service_request.description,
        "category": service_request.category,
        "location": service_request.location,
        "budget": service_request.budget,
        "status": service_request.status,
        "customer_id": service_request.customer_id,
        "artisan_id": service_request.artisan_id,
        "accepted_at": service_request.accepted_at,
        "started_at": service_request.started_at,
        "completed_at": service_request.completed_at,
        "confirmed_at": service_request.confirmed_at,
        "created_at": service_request.created_at,
        "review": review_data,
    }


# ==========================
# Create Service Request
# ==========================
def create_service_request(data, customer_id):
    customer_id = parse_user_id(customer_id)

    if customer_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    title = str(data.get("title", "")).strip()
    description = str(
        data.get("description", ""),
    ).strip()
    category = str(data.get("category", "")).strip()
    location = str(data.get("location", "")).strip()
    budget = data.get("budget")

    if not title:
        return {
            "success": False,
            "message": "Title is required.",
            "status_code": 400,
        }

    if not description:
        return {
            "success": False,
            "message": "Description is required.",
            "status_code": 400,
        }

    if not category:
        return {
            "success": False,
            "message": "Category is required.",
            "status_code": 400,
        }

    if not location:
        return {
            "success": False,
            "message": "Location is required.",
            "status_code": 400,
        }

    if budget is None:
        return {
            "success": False,
            "message": "Budget is required.",
            "status_code": 400,
        }

    try:
        budget_value = float(budget)
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": "Budget must be a valid number.",
            "status_code": 400,
        }

    if budget_value <= 0:
        return {
            "success": False,
            "message": "Budget must be greater than zero.",
            "status_code": 400,
        }

    customer = db.session.get(
        User,
        customer_id,
    )

    if not customer:
        return {
            "success": False,
            "message": "Customer not found.",
            "status_code": 404,
        }

    if customer.role != "customer":
        return {
            "success": False,
            "message": (
                "Only customers can create service requests."
            ),
            "status_code": 403,
        }

    service_request = ServiceRequest(
        title=title,
        description=description,
        category=category,
        location=location,
        budget=budget_value,
        status="open",
        customer_id=customer.id,
    )

    try:
        db.session.add(service_request)
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to create the service request."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": "Service request created successfully.",
        "service_request": service_request_to_dict(
            service_request,
        ),
    }


# ==========================
# Get Accessible Requests
# ==========================
def get_all_service_requests(user_id):
    """
    Return only service requests the logged-in user may access.

    Customers receive requests they created.

    Artisans receive:
    - open marketplace requests, and
    - requests assigned to them.
    """

    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if user.role == "customer":
        service_requests = (
            ServiceRequest.query
            .filter_by(customer_id=user.id)
            .order_by(ServiceRequest.created_at.desc())
            .all()
        )

    elif user.role == "artisan":
        service_requests = (
            ServiceRequest.query
            .filter(
                or_(
                    ServiceRequest.status == "open",
                    ServiceRequest.artisan_id == user.id,
                ),
            )
            .order_by(ServiceRequest.created_at.desc())
            .all()
        )

    else:
        return {
            "success": False,
            "message": (
                "Your account role cannot access "
                "service requests."
            ),
            "status_code": 403,
        }

    return {
        "success": True,
        "count": len(service_requests),
        "service_requests": [
            service_request_to_dict(service_request)
            for service_request in service_requests
        ],
    }


# ==========================
# Get Marketplace Jobs
# ==========================
def get_marketplace_jobs(artisan_id):
    """
    Return all open service requests available to artisans.
    """

    artisan_id = parse_user_id(artisan_id)

    if artisan_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans can access the marketplace."
            ),
            "status_code": 403,
        }

    jobs = (
        ServiceRequest.query
        .filter_by(status="open")
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(jobs),
        "jobs": [
            service_request_to_dict(job)
            for job in jobs
        ],
    }


# ==========================
# Get Single Request
# ==========================
def get_service_request(request_id, user_id):
    """
    Return a request only when the logged-in user may view it.

    A customer may view their own request.

    An artisan may view:
    - an open marketplace request, or
    - a request assigned to them.
    """

    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    service_request = db.session.get(
        ServiceRequest,
        request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    has_access = False

    if user.role == "customer":
        has_access = (
            service_request.customer_id == user.id
        )

    elif user.role == "artisan":
        has_access = (
            service_request.status == "open"
            or service_request.artisan_id == user.id
        )

    if not has_access:
        return {
            "success": False,
            "message": (
                "You are not authorized to view "
                "this service request."
            ),
            "status_code": 403,
        }

    return {
        "success": True,
        "service_request": service_request_to_dict(
            service_request,
        ),
    }


# ==========================
# Accept Service Request
# ==========================
def accept_service_request(request_id, artisan_id):
    artisan_id = parse_user_id(artisan_id)

    if artisan_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans can accept service requests."
            ),
            "status_code": 403,
        }

    service_request = db.session.get(
        ServiceRequest,
        request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    if service_request.status != "open":
        return {
            "success": False,
            "message": (
                "This service request has already been accepted."
            ),
            "status_code": 409,
        }

    service_request.status = "accepted"
    service_request.artisan_id = artisan.id
    service_request.accepted_at = datetime.utcnow()

    try:
        create_notification(
            user_id=service_request.customer_id,
            title="Request accepted",
            message=(
                f'An artisan has accepted your request '
                f'"{service_request.title}".'
            ),
            notification_type="request_accepted",
            commit=False,
        )

        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to accept this service request."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": "Service request accepted successfully.",
        "service_request": service_request_to_dict(
            service_request,
        ),
    }


# ==========================
# Start Service Request
# ==========================
def start_service_request(request_id, artisan_id):
    artisan_id = parse_user_id(artisan_id)

    if artisan_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can start jobs.",
            "status_code": 403,
        }

    service_request = db.session.get(
        ServiceRequest,
        request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    if service_request.artisan_id != artisan.id:
        return {
            "success": False,
            "message": "You are not assigned to this job.",
            "status_code": 403,
        }

    if service_request.status != "accepted":
        return {
            "success": False,
            "message": "Only accepted jobs can be started.",
            "status_code": 409,
        }

    service_request.status = "in_progress"
    service_request.started_at = datetime.utcnow()

    try:
        create_notification(
            user_id=service_request.customer_id,
            title="Job started",
            message=(
                f'Work has started on your request '
                f'"{service_request.title}".'
            ),
            notification_type="job_started",
            commit=False,
        )

        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": "Unable to start this job.",
            "status_code": 500,
        }

    return {
        "success": True,
        "message": "Job started successfully.",
        "service_request": service_request_to_dict(
            service_request,
        ),
    }


# ==========================
# Complete Service Request
# ==========================
def complete_service_request(request_id, artisan_id):
    artisan_id = parse_user_id(artisan_id)

    if artisan_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can complete jobs.",
            "status_code": 403,
        }

    service_request = db.session.get(
        ServiceRequest,
        request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    if service_request.artisan_id != artisan.id:
        return {
            "success": False,
            "message": "You are not assigned to this job.",
            "status_code": 403,
        }

    if service_request.status != "in_progress":
        return {
            "success": False,
            "message": (
                "Only jobs in progress can be completed."
            ),
            "status_code": 409,
        }

    service_request.status = "completed"
    service_request.completed_at = datetime.utcnow()

    try:
        create_notification(
            user_id=service_request.customer_id,
            title="Job completed",
            message=(
                f'The artisan marked "{service_request.title}" '
                f"as completed. Please review the work and "
                f"confirm completion."
            ),
            notification_type="job_completed",
            commit=False,
        )

        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": "Unable to complete this job.",
            "status_code": 500,
        }

    return {
        "success": True,
        "message": "Job completed successfully.",
        "service_request": service_request_to_dict(
            service_request,
        ),
    }


# ==========================
# Confirm Service Request
# ==========================
def confirm_service_request(request_id, customer_id):
    customer_id = parse_user_id(customer_id)

    if customer_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    customer = db.session.get(
        User,
        customer_id,
    )

    if not customer:
        return {
            "success": False,
            "message": "Customer not found.",
            "status_code": 404,
        }

    if customer.role != "customer":
        return {
            "success": False,
            "message": (
                "Only customers can confirm job completion."
            ),
            "status_code": 403,
        }

    service_request = db.session.get(
        ServiceRequest,
        request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
            "status_code": 404,
        }

    if service_request.customer_id != customer.id:
        return {
            "success": False,
            "message": "You do not own this request.",
            "status_code": 403,
        }

    if service_request.status != "completed":
        return {
            "success": False,
            "message": (
                "Only completed jobs can be confirmed."
            ),
            "status_code": 409,
        }

    if not service_request.artisan_id:
        return {
            "success": False,
            "message": (
                "This service request has no assigned artisan."
            ),
            "status_code": 409,
        }

    try:
        release_result = release_confirmed_job_earnings(
            service_request,
            commit=False,
        )

        if not release_result.get("success"):
            db.session.rollback()

            return {
                "success": False,
                "message": release_result.get(
                    "message",
                    "Unable to release the artisan's earnings.",
                ),
                "status_code": release_result.get(
                    "status_code",
                    409,
                ),
            }

        service_request.status = "confirmed"
        service_request.confirmed_at = datetime.utcnow()

        create_notification(
            user_id=service_request.artisan_id,
            title="Completion confirmed",
            message=(
                f'The customer confirmed completion of '
                f'"{service_request.title}". '
                f"Your earnings are now available."
            ),
            notification_type="completion_confirmed",
            commit=False,
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to confirm this job and "
                "release the artisan's earnings."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Job confirmed successfully. "
            "The artisan's earnings are now available."
        ),
        "service_request": service_request_to_dict(
            service_request,
        ),
        "earnings_release": {
            "already_released": release_result.get(
                "already_released",
                False,
            ),
            "wallet": release_result.get(
                "wallet_data",
            ),
            "transaction": release_result.get(
                "transaction_data",
            ),
        },
    }

# ==========================
# Get Customer Requests
# ==========================
def get_my_requests(customer_id):
    customer_id = parse_user_id(customer_id)

    if customer_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    customer = db.session.get(
        User,
        customer_id,
    )

    if not customer:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if customer.role != "customer":
        return {
            "success": False,
            "message": (
                "Only customers have service requests."
            ),
            "status_code": 403,
        }

    service_requests = (
        ServiceRequest.query
        .filter_by(customer_id=customer.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(service_requests),
        "service_requests": [
            service_request_to_dict(service_request)
            for service_request in service_requests
        ],
    }


# ==========================
# Get Artisan Jobs
# ==========================
def get_my_jobs(artisan_id):
    artisan_id = parse_user_id(artisan_id)

    if artisan_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans have jobs.",
            "status_code": 403,
        }

    jobs = (
        ServiceRequest.query
        .filter_by(artisan_id=artisan.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(jobs),
        "jobs": [
            service_request_to_dict(job)
            for job in jobs
        ],
    }