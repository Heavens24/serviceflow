from flask import (
    Blueprint,
    g,
    request,
)
from sqlalchemy import (
    func,
    or_,
)

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
# Supported Values
# ==========================
KNOWN_JOB_STATUSES = {
    "open",
    "accepted",
    "in_progress",
    "confirmed",
}

VALID_USER_ROLES = {
    "customer",
    "artisan",
    "admin",
}

VALID_USER_STATUSES = {
    "active",
    "suspended",
    "banned",
}

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


# ==========================
# Serialize User
# ==========================
def serialize_admin_user(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "role": user.role,
        "status": user.status,
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
        "updated_at": (
            user.updated_at.isoformat()
            if user.updated_at
            else None
        ),
    }


# ==========================
# Parse Boolean Filter
# ==========================
def parse_boolean_filter(
    value,
    field_name,
):
    if value is None or value == "":
        return None, None

    normalized_value = (
        str(value).strip().lower()
    )

    if normalized_value in {
        "true",
        "1",
        "yes",
    }:
        return True, None

    if normalized_value in {
        "false",
        "0",
        "no",
    }:
        return False, None

    return None, {
        "success": False,
        "message": (
            f"{field_name} must be either "
            "true or false."
        ),
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

    in_progress_jobs = (
        ServiceRequest.query.filter_by(
            status="in_progress",
        ).count()
    )

    confirmed_jobs = (
        ServiceRequest.query.filter_by(
            status="confirmed",
        ).count()
    )

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
            serialize_admin_user(user)
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


# ==========================
# Admin User Management
# ==========================
@admin_bp.route(
    "/users",
    methods=["GET"],
)
@admin_required
def get_admin_users():
    search = request.args.get(
        "search",
        "",
    ).strip()

    role = request.args.get(
        "role",
        "",
    ).strip().lower()

    status = request.args.get(
        "status",
        "",
    ).strip().lower()

    city = request.args.get(
        "city",
        "",
    ).strip()

    verified_value = request.args.get(
        "verified",
    )

    email_verified_value = (
        request.args.get(
            "email_verified",
        )
    )

    pro_value = request.args.get(
        "is_pro",
    )

    # ==========================
    # Pagination
    # ==========================
    try:
        page = int(
            request.args.get(
                "page",
                1,
            ),
        )
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": (
                "Page must be a valid integer."
            ),
        }, 400

    try:
        per_page = int(
            request.args.get(
                "per_page",
                DEFAULT_PAGE_SIZE,
            ),
        )
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": (
                "Per-page must be a valid integer."
            ),
        }, 400

    if page < 1:
        return {
            "success": False,
            "message": (
                "Page must be greater than zero."
            ),
        }, 400

    if (
        per_page < 1
        or per_page > MAX_PAGE_SIZE
    ):
        return {
            "success": False,
            "message": (
                "Per-page must be between "
                f"1 and {MAX_PAGE_SIZE}."
            ),
        }, 400

    # ==========================
    # Validate Role and Status
    # ==========================
    if (
        role
        and role != "all"
        and role not in VALID_USER_ROLES
    ):
        return {
            "success": False,
            "message": (
                "Role must be customer, "
                "artisan, or admin."
            ),
        }, 400

    if (
        status
        and status != "all"
        and status not in VALID_USER_STATUSES
    ):
        return {
            "success": False,
            "message": (
                "Status must be active, "
                "suspended, or banned."
            ),
        }, 400

    verified, verified_error = (
        parse_boolean_filter(
            verified_value,
            "Verified",
        )
    )

    if verified_error:
        return verified_error, 400

    email_verified, email_error = (
        parse_boolean_filter(
            email_verified_value,
            "Email verified",
        )
    )

    if email_error:
        return email_error, 400

    is_pro, pro_error = (
        parse_boolean_filter(
            pro_value,
            "Is pro",
        )
    )

    if pro_error:
        return pro_error, 400

    # ==========================
    # Build Query
    # ==========================
    query = User.query

    if search:
        search_pattern = f"%{search}%"

        query = query.filter(
            or_(
                User.full_name.ilike(
                    search_pattern,
                ),
                User.email.ilike(
                    search_pattern,
                ),
                User.phone.ilike(
                    search_pattern,
                ),
                User.city.ilike(
                    search_pattern,
                ),
            ),
        )

    if role and role != "all":
        query = query.filter(
            User.role == role,
        )

    if status and status != "all":
        query = query.filter(
            User.status == status,
        )

    if city:
        query = query.filter(
            func.lower(
                User.city,
            )
            == city.lower(),
        )

    if verified is not None:
        query = query.filter(
            User.verified == verified,
        )

    if email_verified is not None:
        query = query.filter(
            User.email_verified
            == email_verified,
        )

    if is_pro is not None:
        query = query.filter(
            User.is_pro == is_pro,
        )

    query = query.order_by(
        User.created_at.desc(),
        User.id.desc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    users = pagination.items

    # ==========================
    # Filter Options
    # ==========================
    available_cities = [
        city_name
        for (city_name,) in (
            db.session.query(
                User.city,
            )
            .filter(
                User.city.isnot(None),
                User.city != "",
            )
            .distinct()
            .order_by(
                User.city.asc(),
            )
            .all()
        )
    ]

    return {
        "success": True,
        "message": (
            "Users loaded successfully."
        ),
        "users": [
            serialize_admin_user(user)
            for user in users
        ],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_previous": (
                pagination.has_prev
            ),
            "next_page": (
                pagination.next_num
                if pagination.has_next
                else None
            ),
            "previous_page": (
                pagination.prev_num
                if pagination.has_prev
                else None
            ),
        },
        "filters": {
            "search": search,
            "role": role or "all",
            "status": status or "all",
            "city": city,
            "verified": verified,
            "email_verified": (
                email_verified
            ),
            "is_pro": is_pro,
        },
        "filter_options": {
            "roles": sorted(
                VALID_USER_ROLES,
            ),
            "statuses": sorted(
                VALID_USER_STATUSES,
            ),
            "cities": available_cities,
        },
    }, 200