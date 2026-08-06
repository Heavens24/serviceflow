from flask import Blueprint, g
from sqlalchemy import func

from database import db
from models.review import Review
from models.service_request import ServiceRequest
from models.user import User
from utils.admin_required import admin_required


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin",
)


# ==========================
# Supported Job Statuses
# ==========================
KNOWN_JOB_STATUSES = {
    "open",
    "accepted",
    "in_progress",
    "confirmed",
}


# ==========================
# Admin Dashboard
# ==========================
@admin_bp.route(
    "/dashboard",
    methods=["GET"],
)
@admin_required
def admin_dashboard():
    # ==========================
    # User Statistics
    # ==========================
    total_users = User.query.count()

    total_customers = User.query.filter_by(
        role="customer",
    ).count()

    total_artisans = User.query.filter_by(
        role="artisan",
    ).count()

    total_admins = User.query.filter_by(
        role="admin",
    ).count()

    active_users = User.query.filter_by(
        status="active",
    ).count()

    suspended_users = User.query.filter_by(
        status="suspended",
    ).count()

    banned_users = User.query.filter_by(
        status="banned",
    ).count()

    verified_users = User.query.filter_by(
        verified=True,
    ).count()

    email_verified_users = User.query.filter_by(
        email_verified=True,
    ).count()

    pro_users = User.query.filter_by(
        is_pro=True,
    ).count()

    # ==========================
    # Job Statistics
    # ==========================
    total_jobs = ServiceRequest.query.count()

    open_jobs = ServiceRequest.query.filter_by(
        status="open",
    ).count()

    accepted_jobs = ServiceRequest.query.filter_by(
        status="accepted",
    ).count()

    in_progress_jobs = ServiceRequest.query.filter_by(
        status="in_progress",
    ).count()

    confirmed_jobs = ServiceRequest.query.filter_by(
        status="confirmed",
    ).count()

    unclassified_jobs = (
        ServiceRequest.query.filter(
            ~ServiceRequest.status.in_(
                KNOWN_JOB_STATUSES,
            ),
        ).count()
    )

    total_job_value = (
        db.session.query(
            func.coalesce(
                func.sum(
                    ServiceRequest.budget,
                ),
                0,
            ),
        ).scalar()
        or 0
    )

    confirmed_job_value = (
        db.session.query(
            func.coalesce(
                func.sum(
                    ServiceRequest.budget,
                ),
                0,
            ),
        )
        .filter(
            ServiceRequest.status
            == "confirmed",
        )
        .scalar()
        or 0
    )

    # ==========================
    # Review Statistics
    # ==========================
    total_reviews = Review.query.count()

    average_rating = (
        db.session.query(
            func.avg(
                Review.rating,
            ),
        ).scalar()
    )

    average_rating = (
        round(
            float(average_rating),
            1,
        )
        if average_rating is not None
        else 0
    )

    # ==========================
    # Recent Activity
    # ==========================
    recent_users = (
        User.query
        .order_by(
            User.created_at.desc(),
        )
        .limit(5)
        .all()
    )

    recent_jobs = (
        ServiceRequest.query
        .order_by(
            ServiceRequest.created_at.desc(),
        )
        .limit(5)
        .all()
    )

    return {
        "success": True,
        "message": (
            "Admin dashboard loaded successfully."
        ),
        "admin": {
            "id": g.current_user.id,
            "full_name": (
                g.current_user.full_name
            ),
            "email": g.current_user.email,
            "role": g.current_user.role,
            "status": g.current_user.status,
            "verified": (
                g.current_user.verified
            ),
            "email_verified": (
                g.current_user.email_verified
            ),
        },
        "stats": {
            "users": {
                "total": total_users,
                "customers": total_customers,
                "artisans": total_artisans,
                "admins": total_admins,
                "active": active_users,
                "suspended": suspended_users,
                "banned": banned_users,
                "verified": verified_users,
                "email_verified": (
                    email_verified_users
                ),
                "pro": pro_users,
            },
            "jobs": {
                "total": total_jobs,
                "open": open_jobs,
                "accepted": accepted_jobs,
                "in_progress": (
                    in_progress_jobs
                ),
                "confirmed": confirmed_jobs,
                "unclassified": (
                    unclassified_jobs
                ),
                "total_value": float(
                    total_job_value,
                ),
                "confirmed_value": float(
                    confirmed_job_value,
                ),
            },
            "reviews": {
                "total": total_reviews,
                "average_rating": (
                    average_rating
                ),
            },
        },
        "recent_users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "status": user.status,
                "city": user.city,
                "verified": user.verified,
                "email_verified": (
                    user.email_verified
                ),
                "is_pro": user.is_pro,
                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at
                    else None
                ),
            }
            for user in recent_users
        ],
        "recent_jobs": [
            {
                "id": job.id,
                "title": job.title,
                "description": (
                    job.description
                ),
                "category": job.category,
                "location": job.location,
                "budget": float(
                    job.budget or 0,
                ),
                "status": job.status,
                "customer_id": (
                    job.customer_id
                ),
                "artisan_id": (
                    job.artisan_id
                ),
                "accepted_at": (
                    job.accepted_at.isoformat()
                    if job.accepted_at
                    else None
                ),
                "started_at": (
                    job.started_at.isoformat()
                    if job.started_at
                    else None
                ),
                "completed_at": (
                    job.completed_at.isoformat()
                    if job.completed_at
                    else None
                ),
                "confirmed_at": (
                    job.confirmed_at.isoformat()
                    if job.confirmed_at
                    else None
                ),
                "created_at": (
                    job.created_at.isoformat()
                    if job.created_at
                    else None
                ),
            }
            for job in recent_jobs
        ],
    }, 200