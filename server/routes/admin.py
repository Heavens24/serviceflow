from flask import Blueprint, g

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
# Admin Dashboard
# ==========================
@admin_bp.route(
    "/dashboard",
    methods=["GET"],
)
@admin_required
def admin_dashboard():
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

    open_jobs = ServiceRequest.query.filter_by(
        status="open",
    ).count()

    assigned_jobs = ServiceRequest.query.filter_by(
        status="assigned",
    ).count()

    in_progress_jobs = ServiceRequest.query.filter_by(
        status="in_progress",
    ).count()

    completed_jobs = ServiceRequest.query.filter_by(
        status="completed",
    ).count()

    confirmed_jobs = ServiceRequest.query.filter_by(
        status="confirmed",
    ).count()

    total_jobs = ServiceRequest.query.count()

    reviews = Review.query.all()

    total_reviews = len(reviews)

    average_rating = (
        round(
            sum(
                review.rating
                for review in reviews
            )
            / total_reviews,
            1,
        )
        if total_reviews > 0
        else 0
    )

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
            "full_name": g.current_user.full_name,
            "email": g.current_user.email,
            "role": g.current_user.role,
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
            },
            "jobs": {
                "total": total_jobs,
                "open": open_jobs,
                "assigned": assigned_jobs,
                "in_progress": in_progress_jobs,
                "completed": completed_jobs,
                "confirmed": confirmed_jobs,
            },
            "reviews": {
                "total": total_reviews,
                "average_rating": average_rating,
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
                "category": job.category,
                "location": job.location,
                "budget": job.budget,
                "status": job.status,
                "customer_id": job.customer_id,
                "artisan_id": job.artisan_id,
                "created_at": (
                    job.created_at.isoformat()
                    if job.created_at
                    else None
                ),
            }
            for job in recent_jobs
        ],
    }, 200