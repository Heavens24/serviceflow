from datetime import datetime

from database import db
from models.service_request import ServiceRequest
from models.user import User


def service_request_to_dict(request):
    return {
        "id": request.id,
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "location": request.location,
        "budget": request.budget,
        "status": request.status,
        "customer_id": request.customer_id,
        "artisan_id": request.artisan_id,
        "accepted_at": request.accepted_at,
        "started_at": request.started_at,
        "completed_at": request.completed_at,
        "confirmed_at": request.confirmed_at,
    }


def create_service_request(data, customer_id):
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip()
    location = data.get("location", "").strip()
    budget = data.get("budget")

    if not title:
        return {
            "success": False,
            "message": "Title is required.",
        }

    if not description:
        return {
            "success": False,
            "message": "Description is required.",
        }

    if not category:
        return {
            "success": False,
            "message": "Category is required.",
        }

    if not location:
        return {
            "success": False,
            "message": "Location is required.",
        }

    if budget is None:
        return {
            "success": False,
            "message": "Budget is required.",
        }

    request = ServiceRequest(
        title=title,
        description=description,
        category=category,
        location=location,
        budget=float(budget),
        customer_id=int(customer_id),
    )

    db.session.add(request)
    db.session.commit()

    return {
        "success": True,
        "message": "Service request created successfully.",
        "service_request": service_request_to_dict(request),
    }


def get_all_service_requests():
    requests = (
        ServiceRequest.query
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(requests),
        "service_requests": [
            service_request_to_dict(request)
            for request in requests
        ],
    }


def get_service_request(request_id):
    service_request = ServiceRequest.query.get(request_id)

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    return {
        "success": True,
        "service_request": service_request_to_dict(service_request),
    }


def accept_service_request(request_id, artisan_id):
    user = User.query.get(int(artisan_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can accept service requests.",
        }

    service_request = ServiceRequest.query.get(request_id)

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    if service_request.status != "open":
        return {
            "success": False,
            "message": "This service request has already been accepted.",
        }

    service_request.status = "accepted"
    service_request.artisan_id = user.id
    service_request.accepted_at = datetime.utcnow()

    db.session.commit()

    return {
        "success": True,
        "message": "Service request accepted successfully.",
        "service_request": service_request_to_dict(service_request),
    }


def start_service_request(request_id, artisan_id):
    user = User.query.get(int(artisan_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can start jobs.",
        }

    service_request = ServiceRequest.query.get(request_id)

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    if service_request.artisan_id != user.id:
        return {
            "success": False,
            "message": "You are not assigned to this job.",
        }

    if service_request.status != "accepted":
        return {
            "success": False,
            "message": "Only accepted jobs can be started.",
        }

    service_request.status = "in_progress"
    service_request.started_at = datetime.utcnow()

    db.session.commit()

    return {
        "success": True,
        "message": "Job started successfully.",
        "service_request": service_request_to_dict(service_request),
    }


def complete_service_request(request_id, artisan_id):
    user = User.query.get(int(artisan_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can complete jobs.",
        }

    service_request = ServiceRequest.query.get(request_id)

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    if service_request.artisan_id != user.id:
        return {
            "success": False,
            "message": "You are not assigned to this job.",
        }

    if service_request.status != "in_progress":
        return {
            "success": False,
            "message": "Only jobs in progress can be completed.",
        }

    service_request.status = "completed"
    service_request.completed_at = datetime.utcnow()

    db.session.commit()

    return {
        "success": True,
        "message": "Job completed successfully.",
        "service_request": service_request_to_dict(service_request),
    }


def confirm_service_request(request_id, customer_id):
    service_request = ServiceRequest.query.get(request_id)

    if not service_request:
        return {
            "success": False,
            "message": "Service request not found.",
        }

    if service_request.customer_id != int(customer_id):
        return {
            "success": False,
            "message": "You do not own this request.",
        }

    if service_request.status != "completed":
        return {
            "success": False,
            "message": "Only completed jobs can be confirmed.",
        }

    service_request.status = "confirmed"
    service_request.confirmed_at = datetime.utcnow()

    db.session.commit()

    return {
        "success": True,
        "message": "Job confirmed successfully.",
        "service_request": service_request_to_dict(service_request),
    }


def get_my_requests(customer_id):
    requests = (
        ServiceRequest.query
        .filter_by(customer_id=int(customer_id))
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(requests),
        "service_requests": [
            service_request_to_dict(request)
            for request in requests
        ],
    }


def get_my_jobs(artisan_id):
    user = User.query.get(int(artisan_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans have jobs.",
        }

    jobs = (
        ServiceRequest.query
        .filter_by(artisan_id=user.id)
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