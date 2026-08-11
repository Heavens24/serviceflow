from datetime import datetime

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
from models.transaction import Transaction
from models.user import User
from models.withdrawal import Withdrawal
from models.withdrawal_audit import WithdrawalAudit
from services.payment_service import (
    finalize_withdrawal_transfer,
    initiate_withdrawal_transfer,
    inspect_withdrawal_transfer_for_cancellation,
    verify_withdrawal_transfer,
)
from services.wallet_service import (
    approve_withdrawal,
    ensure_withdrawal_transfer_reference,
    get_withdrawal_transfer_reference,
    mark_withdrawal_failed,
    mark_withdrawal_paid,
    record_withdrawal_transfer,
    reject_withdrawal,
    transaction_to_dict,
    withdrawal_to_dict,
)
from services.withdrawal_event_service import (
    get_withdrawal_audit_events,
    record_withdrawal_event,
)
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

# ==========================
# Update User Status
# ==========================
@admin_bp.route(
    "/users/<int:user_id>/status",
    methods=["PATCH"],
)
@admin_required
def update_admin_user_status(user_id):
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    status = str(
        data.get(
            "status",
            "",
        ),
    ).strip().lower()

    if not status:
        return {
            "success": False,
            "message": "Status is required.",
        }, 400

    if status not in VALID_USER_STATUSES:
        return {
            "success": False,
            "message": (
                "Status must be active, "
                "suspended, or banned."
            ),
        }, 400

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }, 404

    if (
        user.id == g.current_user.id
        and status != "active"
    ):
        return {
            "success": False,
            "message": (
                "You cannot suspend or ban "
                "your own administrator account."
            ),
        }, 400

    if (
        user.role == "admin"
        and user.status == "active"
        and status != "active"
    ):
        active_admins = User.query.filter_by(
            role="admin",
            status="active",
        ).count()

        if active_admins <= 1:
            return {
                "success": False,
                "message": (
                    "The last active administrator "
                    "cannot be suspended or banned."
                ),
            }, 400

    if user.status == status:
        return {
            "success": True,
            "message": (
                f"User status is already {status}."
            ),
            "user": serialize_admin_user(
                user,
            ),
        }, 200

    user.status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to update the user status "
                "right now."
            ),
        }, 500

    return {
        "success": True,
        "message": (
            f"User status updated to {status}."
        ),
        "user": serialize_admin_user(
            user,
        ),
    }, 200


# ==========================
# Update User Verification
# ==========================
@admin_bp.route(
    "/users/<int:user_id>/verify",
    methods=["PATCH"],
)
@admin_required
def update_admin_user_verification(user_id):
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    has_verified = "verified" in data
    has_email_verified = (
        "email_verified" in data
    )

    if (
        not has_verified
        and not has_email_verified
    ):
        return {
            "success": False,
            "message": (
                "Provide verified or "
                "email_verified."
            ),
        }, 400

    verified = None
    email_verified = None

    if has_verified:
        verified, verified_error = (
            parse_boolean_filter(
                data.get("verified"),
                "Verified",
            )
        )

        if verified_error:
            return verified_error, 400

        if verified is None:
            return {
                "success": False,
                "message": (
                    "Verified must be either "
                    "true or false."
                ),
            }, 400

    if has_email_verified:
        (
            email_verified,
            email_verified_error,
        ) = parse_boolean_filter(
            data.get("email_verified"),
            "Email verified",
        )

        if email_verified_error:
            return email_verified_error, 400

        if email_verified is None:
            return {
                "success": False,
                "message": (
                    "Email verified must be either "
                    "true or false."
                ),
            }, 400

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }, 404

    if has_verified:
        user.verified = verified

    if has_email_verified:
        user.email_verified = (
            email_verified
        )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to update verification "
                "right now."
            ),
        }, 500

    return {
        "success": True,
        "message": (
            "User verification updated "
            "successfully."
        ),
        "user": serialize_admin_user(
            user,
        ),
    }, 200


# ==========================
# Update User Role
# ==========================
@admin_bp.route(
    "/users/<int:user_id>/role",
    methods=["PATCH"],
)
@admin_required
def update_admin_user_role(user_id):
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    role = str(
        data.get(
            "role",
            "",
        ),
    ).strip().lower()

    if not role:
        return {
            "success": False,
            "message": "Role is required.",
        }, 400

    if role not in VALID_USER_ROLES:
        return {
            "success": False,
            "message": (
                "Role must be customer, "
                "artisan, or admin."
            ),
        }, 400

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }, 404

    if user.id == g.current_user.id:
        return {
            "success": False,
            "message": (
                "You cannot change your own "
                "administrator role."
            ),
        }, 400

    if (
        user.role == "admin"
        and role != "admin"
    ):
        active_admins = User.query.filter_by(
            role="admin",
            status="active",
        ).count()

        if (
            user.status == "active"
            and active_admins <= 1
        ):
            return {
                "success": False,
                "message": (
                    "The last active administrator "
                    "cannot be demoted."
                ),
            }, 400

    if user.role == role:
        return {
            "success": True,
            "message": (
                f"User role is already {role}."
            ),
            "user": serialize_admin_user(
                user,
            ),
        }, 200

    user.role = role

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to update the user role "
                "right now."
            ),
        }, 500

    return {
        "success": True,
        "message": (
            f"User role updated to {role}."
        ),
        "user": serialize_admin_user(
            user,
        ),
    }, 200

# ==========================
# Serialize Job User Summary
# ==========================
def serialize_job_user_summary(user):
    if not user:
        return None

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "role": user.role,
        "status": user.status,
        "verified": user.verified,
    }


# ==========================
# Serialize Admin Job
# ==========================
def serialize_admin_job(
    job,
    users_by_id=None,
):
    users_by_id = users_by_id or {}

    customer = users_by_id.get(
        job.customer_id,
    )

    artisan = (
        users_by_id.get(job.artisan_id)
        if job.artisan_id
        else None
    )

    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "category": job.category,
        "location": job.location,
        "budget": float(job.budget or 0),
        "status": job.status,
        "customer_id": job.customer_id,
        "artisan_id": job.artisan_id,
        "customer": serialize_job_user_summary(
            customer,
        ),
        "artisan": serialize_job_user_summary(
            artisan,
        ),
        "has_review": job.review is not None,
        "message_count": len(job.messages or []),
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


def parse_optional_integer(value, field_name):
    if value is None or value == "":
        return None, None

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        return None, {
            "success": False,
            "message": (
                f"{field_name} must be a valid integer."
            ),
        }

    if parsed_value < 1:
        return None, {
            "success": False,
            "message": (
                f"{field_name} must be greater than zero."
            ),
        }

    return parsed_value, None


def parse_optional_number(value, field_name):
    if value is None or value == "":
        return None, None

    try:
        parsed_value = float(value)
    except (TypeError, ValueError):
        return None, {
            "success": False,
            "message": (
                f"{field_name} must be a valid number."
            ),
        }

    if parsed_value < 0:
        return None, {
            "success": False,
            "message": (
                f"{field_name} cannot be negative."
            ),
        }

    return parsed_value, None


# ==========================
# Admin Job Management
# ==========================
@admin_bp.route(
    "/jobs",
    methods=["GET"],
)
@admin_required
def get_admin_jobs():
    search = request.args.get(
        "search",
        "",
    ).strip()

    status = request.args.get(
        "status",
        "",
    ).strip().lower()

    category = request.args.get(
        "category",
        "",
    ).strip()

    location = request.args.get(
        "location",
        "",
    ).strip()

    sort = request.args.get(
        "sort",
        "newest",
    ).strip().lower()

    customer_id, customer_error = parse_optional_integer(
        request.args.get("customer_id"),
        "Customer ID",
    )

    if customer_error:
        return customer_error, 400

    artisan_id, artisan_error = parse_optional_integer(
        request.args.get("artisan_id"),
        "Artisan ID",
    )

    if artisan_error:
        return artisan_error, 400

    min_budget, min_budget_error = parse_optional_number(
        request.args.get("min_budget"),
        "Minimum budget",
    )

    if min_budget_error:
        return min_budget_error, 400

    max_budget, max_budget_error = parse_optional_number(
        request.args.get("max_budget"),
        "Maximum budget",
    )

    if max_budget_error:
        return max_budget_error, 400

    if (
        min_budget is not None
        and max_budget is not None
        and min_budget > max_budget
    ):
        return {
            "success": False,
            "message": (
                "Minimum budget cannot be greater than maximum budget."
            ),
        }, 400

    page, page_error = parse_optional_integer(
        request.args.get("page", 1),
        "Page",
    )

    if page_error:
        return page_error, 400

    per_page, per_page_error = parse_optional_integer(
        request.args.get(
            "per_page",
            DEFAULT_PAGE_SIZE,
        ),
        "Per-page",
    )

    if per_page_error:
        return per_page_error, 400

    if per_page > MAX_PAGE_SIZE:
        return {
            "success": False,
            "message": (
                "Per-page must be between "
                f"1 and {MAX_PAGE_SIZE}."
            ),
        }, 400

    valid_sort_options = {
        "newest",
        "oldest",
        "budget_high",
        "budget_low",
    }

    if sort not in valid_sort_options:
        return {
            "success": False,
            "message": (
                "Sort must be newest, oldest, "
                "budget_high, or budget_low."
            ),
        }, 400

    query = ServiceRequest.query

    if search:
        search_pattern = f"%{search}%"

        query = query.filter(
            or_(
                ServiceRequest.title.ilike(
                    search_pattern,
                ),
                ServiceRequest.description.ilike(
                    search_pattern,
                ),
                ServiceRequest.category.ilike(
                    search_pattern,
                ),
                ServiceRequest.location.ilike(
                    search_pattern,
                ),
            ),
        )

    if status and status != "all":
        query = query.filter(
            func.lower(
                ServiceRequest.status,
            )
            == status,
        )

    if category and category != "all":
        query = query.filter(
            func.lower(
                ServiceRequest.category,
            )
            == category.lower(),
        )

    if location and location != "all":
        query = query.filter(
            func.lower(
                ServiceRequest.location,
            )
            == location.lower(),
        )

    if customer_id is not None:
        query = query.filter(
            ServiceRequest.customer_id
            == customer_id,
        )

    if artisan_id is not None:
        query = query.filter(
            ServiceRequest.artisan_id
            == artisan_id,
        )

    if min_budget is not None:
        query = query.filter(
            ServiceRequest.budget
            >= min_budget,
        )

    if max_budget is not None:
        query = query.filter(
            ServiceRequest.budget
            <= max_budget,
        )

    filtered_total = query.count()

    filtered_value = (
        query.with_entities(
            func.coalesce(
                func.sum(
                    ServiceRequest.budget,
                ),
                0,
            ),
        ).scalar()
        or 0
    )

    if sort == "oldest":
        query = query.order_by(
            ServiceRequest.created_at.asc(),
            ServiceRequest.id.asc(),
        )
    elif sort == "budget_high":
        query = query.order_by(
            ServiceRequest.budget.desc(),
            ServiceRequest.created_at.desc(),
        )
    elif sort == "budget_low":
        query = query.order_by(
            ServiceRequest.budget.asc(),
            ServiceRequest.created_at.desc(),
        )
    else:
        query = query.order_by(
            ServiceRequest.created_at.desc(),
            ServiceRequest.id.desc(),
        )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    jobs = pagination.items

    related_user_ids = {
        user_id
        for job in jobs
        for user_id in (
            job.customer_id,
            job.artisan_id,
        )
        if user_id is not None
    }

    users_by_id = {}

    if related_user_ids:
        related_users = (
            User.query.filter(
                User.id.in_(
                    related_user_ids,
                ),
            ).all()
        )

        users_by_id = {
            user.id: user
            for user in related_users
        }

    available_statuses = [
        value
        for (value,) in (
            db.session.query(
                ServiceRequest.status,
            )
            .filter(
                ServiceRequest.status.isnot(None),
                ServiceRequest.status != "",
            )
            .distinct()
            .order_by(
                ServiceRequest.status.asc(),
            )
            .all()
        )
    ]

    available_categories = [
        value
        for (value,) in (
            db.session.query(
                ServiceRequest.category,
            )
            .filter(
                ServiceRequest.category.isnot(None),
                ServiceRequest.category != "",
            )
            .distinct()
            .order_by(
                ServiceRequest.category.asc(),
            )
            .all()
        )
    ]

    available_locations = [
        value
        for (value,) in (
            db.session.query(
                ServiceRequest.location,
            )
            .filter(
                ServiceRequest.location.isnot(None),
                ServiceRequest.location != "",
            )
            .distinct()
            .order_by(
                ServiceRequest.location.asc(),
            )
            .all()
        )
    ]

    return {
        "success": True,
        "message": "Jobs loaded successfully.",
        "jobs": [
            serialize_admin_job(
                job,
                users_by_id,
            )
            for job in jobs
        ],
        "summary": {
            "matching_jobs": filtered_total,
            "matching_value": float(
                filtered_value,
            ),
        },
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_previous": pagination.has_prev,
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
            "status": status or "all",
            "category": category or "all",
            "location": location or "all",
            "customer_id": customer_id,
            "artisan_id": artisan_id,
            "min_budget": min_budget,
            "max_budget": max_budget,
            "sort": sort,
        },
        "filter_options": {
            "statuses": available_statuses,
            "categories": available_categories,
            "locations": available_locations,
            "sorts": [
                "newest",
                "oldest",
                "budget_high",
                "budget_low",
            ],
        },
    }, 200

# ==========================
# Supported Admin Job Statuses
# ==========================
VALID_ADMIN_JOB_STATUSES = {
    "open",
    "accepted",
    "in_progress",
    "completed",
    "confirmed",
    "cancelled",
}


# ==========================
# Load Job User Map
# ==========================
def get_job_users_by_id(job):
    user_ids = {
        user_id
        for user_id in (
            job.customer_id,
            job.artisan_id,
        )
        if user_id is not None
    }

    if not user_ids:
        return {}

    users = (
        User.query.filter(
            User.id.in_(user_ids),
        ).all()
    )

    return {
        user.id: user
        for user in users
    }


# ==========================
# Get One Admin Job
# ==========================
@admin_bp.route(
    "/jobs/<int:job_id>",
    methods=["GET"],
)
@admin_required
def get_admin_job(job_id):
    job = db.session.get(
        ServiceRequest,
        job_id,
    )

    if not job:
        return {
            "success": False,
            "message": "Job not found.",
        }, 404

    users_by_id = get_job_users_by_id(
        job,
    )

    return {
        "success": True,
        "message": (
            "Job loaded successfully."
        ),
        "job": serialize_admin_job(
            job,
            users_by_id,
        ),
    }, 200


# ==========================
# Update Admin Job Status
# ==========================
@admin_bp.route(
    "/jobs/<int:job_id>/status",
    methods=["PATCH"],
)
@admin_required
def update_admin_job_status(job_id):
    data = request.get_json(
        silent=True,
    )

    if not isinstance(data, dict):
        return {
            "success": False,
            "message": (
                "A valid JSON request body "
                "is required."
            ),
        }, 400

    status = str(
        data.get(
            "status",
            "",
        ),
    ).strip().lower()

    if not status:
        return {
            "success": False,
            "message": (
                "Job status is required."
            ),
        }, 400

    if status not in VALID_ADMIN_JOB_STATUSES:
        return {
            "success": False,
            "message": (
                "Status must be open, accepted, "
                "in_progress, completed, "
                "confirmed, or cancelled."
            ),
        }, 400

    job = db.session.get(
        ServiceRequest,
        job_id,
    )

    if not job:
        return {
            "success": False,
            "message": "Job not found.",
        }, 404

    if job.status == status:
        users_by_id = (
            get_job_users_by_id(job)
        )

        return {
            "success": True,
            "message": (
                f"Job status is already {status}."
            ),
            "job": serialize_admin_job(
                job,
                users_by_id,
            ),
        }, 200

    statuses_requiring_artisan = {
        "accepted",
        "in_progress",
        "completed",
        "confirmed",
    }

    if (
        status in statuses_requiring_artisan
        and job.artisan_id is None
    ):
        return {
            "success": False,
            "message": (
                "This status requires an artisan "
                "who accepted the job. Admins do "
                "not assign artisans."
            ),
        }, 400

    now = datetime.utcnow()

    if status == "open":
        job.artisan_id = None
        job.accepted_at = None
        job.started_at = None
        job.completed_at = None
        job.confirmed_at = None

    elif status == "accepted":
        if job.accepted_at is None:
            job.accepted_at = now

        job.started_at = None
        job.completed_at = None
        job.confirmed_at = None

    elif status == "in_progress":
        if job.accepted_at is None:
            job.accepted_at = now

        if job.started_at is None:
            job.started_at = now

        job.completed_at = None
        job.confirmed_at = None

    elif status == "completed":
        if job.accepted_at is None:
            job.accepted_at = now

        if job.started_at is None:
            job.started_at = now

        if job.completed_at is None:
            job.completed_at = now

        job.confirmed_at = None

    elif status == "confirmed":
        if job.accepted_at is None:
            job.accepted_at = now

        if job.started_at is None:
            job.started_at = now

        if job.completed_at is None:
            job.completed_at = now

        if job.confirmed_at is None:
            job.confirmed_at = now

    elif status == "cancelled":
        # Preserve the artisan and lifecycle history
        # for moderation and dispute review.
        pass

    job.status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to update the job status "
                "right now."
            ),
        }, 500

    users_by_id = get_job_users_by_id(
        job,
    )

    return {
        "success": True,
        "message": (
            f"Job status updated to {status}."
        ),
        "job": serialize_admin_job(
            job,
            users_by_id,
        ),
    }, 200


# ==========================
# Delete Admin Job
# ==========================
@admin_bp.route(
    "/jobs/<int:job_id>",
    methods=["DELETE"],
)
@admin_required
def delete_admin_job(job_id):
    job = db.session.get(
        ServiceRequest,
        job_id,
    )

    if not job:
        return {
            "success": False,
            "message": "Job not found.",
        }, 404

    deletable_statuses = {
        "open",
        "cancelled",
    }

    if job.status not in deletable_statuses:
        return {
            "success": False,
            "message": (
                "Only open or cancelled jobs "
                "can be deleted. Cancel the job "
                "first to preserve marketplace "
                "workflow integrity."
            ),
        }, 400

    deleted_job = {
        "id": job.id,
        "title": job.title,
        "status": job.status,
    }

    try:
        db.session.delete(job)
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to delete the job "
                "right now."
            ),
        }, 500

    return {
        "success": True,
        "message": (
            "Job deleted successfully."
        ),
        "job": deleted_job,
    }, 200


# ==========================
# Serialize Review User
# ==========================
def serialize_review_user(user):
    if not user:
        return None

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "role": user.role,
        "status": user.status,
        "verified": user.verified,
    }


# ==========================
# Serialize Review Job
# ==========================
def serialize_review_job(job):
    if not job:
        return None

    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "category": job.category,
        "location": job.location,
        "budget": float(job.budget or 0),
        "status": job.status,
        "customer_id": job.customer_id,
        "artisan_id": job.artisan_id,
        "created_at": (
            job.created_at.isoformat()
            if job.created_at
            else None
        ),
        "confirmed_at": (
            job.confirmed_at.isoformat()
            if job.confirmed_at
            else None
        ),
    }


# ==========================
# Serialize Admin Review
# ==========================
def serialize_admin_review(review):
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "customer_id": review.customer_id,
        "artisan_id": review.artisan_id,
        "service_request_id": (
            review.service_request_id
        ),
        "customer": serialize_review_user(
            review.customer,
        ),
        "artisan": serialize_review_user(
            review.artisan,
        ),
        "job": serialize_review_job(
            review.service_request,
        ),
        "created_at": (
            review.created_at.isoformat()
            if review.created_at
            else None
        ),
    }


# ==========================
# Admin Review Management
# ==========================
@admin_bp.route(
    "/reviews",
    methods=["GET"],
)
@admin_required
def get_admin_reviews():
    search = request.args.get(
        "search",
        "",
    ).strip()

    sort = request.args.get(
        "sort",
        "newest",
    ).strip().lower()

    rating, rating_error = parse_optional_integer(
        request.args.get("rating"),
        "Rating",
    )

    if rating_error:
        return rating_error, 400

    if (
        rating is not None
        and rating not in {1, 2, 3, 4, 5}
    ):
        return {
            "success": False,
            "message": (
                "Rating must be between 1 and 5."
            ),
        }, 400

    customer_id, customer_error = (
        parse_optional_integer(
            request.args.get("customer_id"),
            "Customer ID",
        )
    )

    if customer_error:
        return customer_error, 400

    artisan_id, artisan_error = (
        parse_optional_integer(
            request.args.get("artisan_id"),
            "Artisan ID",
        )
    )

    if artisan_error:
        return artisan_error, 400

    service_request_id, job_error = (
        parse_optional_integer(
            request.args.get(
                "service_request_id",
            ),
            "Service request ID",
        )
    )

    if job_error:
        return job_error, 400

    page, page_error = parse_optional_integer(
        request.args.get("page", 1),
        "Page",
    )

    if page_error:
        return page_error, 400

    per_page, per_page_error = (
        parse_optional_integer(
            request.args.get(
                "per_page",
                DEFAULT_PAGE_SIZE,
            ),
            "Per-page",
        )
    )

    if per_page_error:
        return per_page_error, 400

    if per_page > MAX_PAGE_SIZE:
        return {
            "success": False,
            "message": (
                "Per-page must be between "
                f"1 and {MAX_PAGE_SIZE}."
            ),
        }, 400

    valid_sort_options = {
        "newest",
        "oldest",
        "rating_high",
        "rating_low",
    }

    if sort not in valid_sort_options:
        return {
            "success": False,
            "message": (
                "Sort must be newest, oldest, "
                "rating_high, or rating_low."
            ),
        }, 400

    query = Review.query

    if search:
        search_pattern = f"%{search}%"

        query = query.filter(
            or_(
                Review.comment.ilike(
                    search_pattern,
                ),
                Review.customer.has(
                    or_(
                        User.full_name.ilike(
                            search_pattern,
                        ),
                        User.email.ilike(
                            search_pattern,
                        ),
                    ),
                ),
                Review.artisan.has(
                    or_(
                        User.full_name.ilike(
                            search_pattern,
                        ),
                        User.email.ilike(
                            search_pattern,
                        ),
                    ),
                ),
                Review.service_request.has(
                    or_(
                        ServiceRequest.title.ilike(
                            search_pattern,
                        ),
                        ServiceRequest.description.ilike(
                            search_pattern,
                        ),
                        ServiceRequest.category.ilike(
                            search_pattern,
                        ),
                        ServiceRequest.location.ilike(
                            search_pattern,
                        ),
                    ),
                ),
            ),
        )

    if rating is not None:
        query = query.filter(
            Review.rating == rating,
        )

    if customer_id is not None:
        query = query.filter(
            Review.customer_id == customer_id,
        )

    if artisan_id is not None:
        query = query.filter(
            Review.artisan_id == artisan_id,
        )

    if service_request_id is not None:
        query = query.filter(
            Review.service_request_id
            == service_request_id,
        )

    matching_reviews = query.count()

    matching_average = (
        query.with_entities(
            func.avg(Review.rating),
        ).scalar()
    )

    matching_average = (
        round(float(matching_average), 1)
        if matching_average is not None
        else 0
    )

    rating_breakdown = {
        str(number): query.filter(
            Review.rating == number,
        ).count()
        for number in range(1, 6)
    }

    if sort == "oldest":
        query = query.order_by(
            Review.created_at.asc(),
            Review.id.asc(),
        )
    elif sort == "rating_high":
        query = query.order_by(
            Review.rating.desc(),
            Review.created_at.desc(),
        )
    elif sort == "rating_low":
        query = query.order_by(
            Review.rating.asc(),
            Review.created_at.desc(),
        )
    else:
        query = query.order_by(
            Review.created_at.desc(),
            Review.id.desc(),
        )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return {
        "success": True,
        "message": "Reviews loaded successfully.",
        "reviews": [
            serialize_admin_review(review)
            for review in pagination.items
        ],
        "summary": {
            "matching_reviews": matching_reviews,
            "average_rating": matching_average,
            "rating_breakdown": rating_breakdown,
        },
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_previous": pagination.has_prev,
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
            "rating": rating,
            "customer_id": customer_id,
            "artisan_id": artisan_id,
            "service_request_id": (
                service_request_id
            ),
            "sort": sort,
        },
        "filter_options": {
            "ratings": [1, 2, 3, 4, 5],
            "sorts": [
                "newest",
                "oldest",
                "rating_high",
                "rating_low",
            ],
        },
    }, 200


# ==========================
# Get One Admin Review
# ==========================
@admin_bp.route(
    "/reviews/<int:review_id>",
    methods=["GET"],
)
@admin_required
def get_admin_review(review_id):
    review = db.session.get(
        Review,
        review_id,
    )

    if not review:
        return {
            "success": False,
            "message": "Review not found.",
        }, 404

    return {
        "success": True,
        "message": "Review loaded successfully.",
        "review": serialize_admin_review(
            review,
        ),
    }, 200


# ==========================
# Delete Admin Review
# ==========================
@admin_bp.route(
    "/reviews/<int:review_id>",
    methods=["DELETE"],
)
@admin_required
def delete_admin_review(review_id):
    review = db.session.get(
        Review,
        review_id,
    )

    if not review:
        return {
            "success": False,
            "message": "Review not found.",
        }, 404

    deleted_review = {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "customer_id": review.customer_id,
        "artisan_id": review.artisan_id,
        "service_request_id": (
            review.service_request_id
        ),
    }

    try:
        db.session.delete(review)
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to delete the review "
                "right now."
            ),
        }, 500

    return {
        "success": True,
        "message": "Review deleted successfully.",
        "review": deleted_review,
    }, 200


# ==========================
# Admin Withdrawal Helpers
# ==========================
def serialize_admin_withdrawal(
    withdrawal,
):
    if not withdrawal:
        return None

    artisan = db.session.get(
        User,
        withdrawal.artisan_id,
    )

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        )
        .order_by(
            Transaction.created_at.desc(),
            Transaction.id.desc(),
        )
        .first()
    )

    return {
        "withdrawal": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "artisan": (
            {
                "id": artisan.id,
                "full_name": artisan.full_name,
                "email": artisan.email,
                "phone": artisan.phone,
                "status": artisan.status,
                "verified": artisan.verified,
            }
            if artisan
            else None
        ),
        "transaction": (
            transaction_to_dict(
                transaction,
            )
            if transaction
            else None
        ),
    }


# ==========================
# List Admin Withdrawals
# ==========================
@admin_bp.route(
    "/withdrawals",
    methods=["GET"],
)
@admin_required
def get_admin_withdrawals():
    status = (
        request.args.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    page, page_error = (
        parse_optional_integer(
            request.args.get(
                "page",
                1,
            ),
            "Page",
        )
    )

    if page_error:
        return page_error, 400

    per_page, per_page_error = (
        parse_optional_integer(
            request.args.get(
                "per_page",
                DEFAULT_PAGE_SIZE,
            ),
            "Per-page",
        )
    )

    if per_page_error:
        return per_page_error, 400

    if per_page > MAX_PAGE_SIZE:
        return {
            "success": False,
            "message": (
                "Per-page must be between "
                f"1 and {MAX_PAGE_SIZE}."
            ),
        }, 400

    valid_statuses = {
        "pending",
        "approved",
        "processing",
        "paid",
        "failed",
        "rejected",
    }

    if (
        status
        and status != "all"
        and status not in valid_statuses
    ):
        return {
            "success": False,
            "message": (
                "Invalid withdrawal status."
            ),
        }, 400

    query = Withdrawal.query

    if status and status != "all":
        query = query.filter(
            Withdrawal.status == status,
        )

    query = query.order_by(
        Withdrawal.requested_at.desc(),
        Withdrawal.id.desc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return {
        "success": True,
        "message": (
            "Withdrawals loaded successfully."
        ),
        "withdrawals": [
            serialize_admin_withdrawal(
                withdrawal,
            )
            for withdrawal
            in pagination.items
        ],
        "filters": {
            "status": status or "all",
        },
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
    }, 200


# ==========================
# Get One Admin Withdrawal
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>",
    methods=["GET"],
)
@admin_required
def get_admin_withdrawal(
    withdrawal_id,
):
    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": (
                "Withdrawal not found."
            ),
        }, 404

    return {
        "success": True,
        "message": (
            "Withdrawal loaded successfully."
        ),
        **serialize_admin_withdrawal(
            withdrawal,
        ),
    }, 200


# ==========================
# Withdrawal Audit Trail
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/audit",
    methods=["GET"],
)
@admin_required
def get_admin_withdrawal_audit(
    withdrawal_id,
):
    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": "Withdrawal not found.",
        }, 404

    return {
        "success": True,
        "message": (
            "Withdrawal audit trail loaded "
            "successfully."
        ),
        "withdrawal": withdrawal_to_dict(
            withdrawal,
        ),
        "audit_events": (
            get_withdrawal_audit_events(
                withdrawal.id,
            )
        ),
    }, 200


# ==========================
# Approve Admin Withdrawal
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/approve",
    methods=["POST"],
)
@admin_required
def approve_admin_withdrawal(
    withdrawal_id,
):
    result = approve_withdrawal(
        withdrawal_id=withdrawal_id,
        admin_id=g.current_user.id,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                "Unable to approve withdrawal.",
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            "Withdrawal approved successfully.",
        ),
        "withdrawal": result.get(
            "withdrawal_data",
        ),
    }, 200


# ==========================
# Reject / Cancel Admin Withdrawal
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/reject",
    methods=["POST"],
)
@admin_required
def reject_admin_withdrawal(
    withdrawal_id,
):
    data = request.get_json(
        silent=True,
    ) or {}

    reason = str(
        data.get(
            "reason",
            "",
        )
        or ""
    ).strip()

    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": (
                "Withdrawal not found."
            ),
        }, 404

    # --------------------------------------
    # Pending: refund immediately
    # --------------------------------------
    if withdrawal.status == "pending":
        result = reject_withdrawal(
            withdrawal_id=withdrawal.id,
            admin_id=g.current_user.id,
            reason=reason or None,
        )

    # --------------------------------------
    # Rejected: idempotent response
    # --------------------------------------
    elif withdrawal.status == "rejected":
        result = reject_withdrawal(
            withdrawal_id=withdrawal.id,
            admin_id=g.current_user.id,
            reason=reason or None,
        )

    # --------------------------------------
    # Approved: provider-aware cancellation
    # --------------------------------------
    elif withdrawal.status == "approved":
        if withdrawal.transfer_code:
            return {
                "success": False,
                "code": (
                    "PAYOUT_TRANSFER_ALREADY_EXISTS"
                ),
                "message": (
                    "This withdrawal already has "
                    "a Paystack transfer code. "
                    "Verify the transfer before "
                    "taking any refund action."
                ),
                "withdrawal": (
                    withdrawal_to_dict(
                        withdrawal,
                    )
                ),
                "funds_reserved": True,
                "next_action": (
                    "verify_existing_transfer"
                ),
            }, 409

        transaction = (
            Transaction.query.filter_by(
                withdrawal_id=withdrawal.id,
                transaction_type="withdrawal",
            )
            .order_by(
                Transaction.created_at.desc(),
                Transaction.id.desc(),
            )
            .first()
        )

        provider_reference = str(
            (
                transaction.provider_reference
                if transaction
                else ""
            )
            or ""
        ).strip().lower()

        # No reference means ServiceFlow has never
        # prepared an external transfer for this
        # withdrawal, so cancellation is safe.
        if not provider_reference:
            provider_check = {
                "success": True,
                "transfer_exists": False,
                "safe_to_cancel": True,
                "reference": None,
                "provider_status": None,
                "message": (
                    "No provider transfer "
                    "reference exists."
                ),
            }
        else:
            provider_check = (
                inspect_withdrawal_transfer_for_cancellation(
                    provider_reference,
                )
            )

        if not provider_check.get(
            "success"
        ):
            return {
                "success": False,
                "code": provider_check.get(
                    "error_code",
                    (
                        "PAYOUT_CANCELLATION_CHECK_FAILED"
                    ),
                ),
                "message": provider_check.get(
                    "message",
                    (
                        "ServiceFlow could not "
                        "safely confirm whether "
                        "a Paystack transfer "
                        "exists."
                    ),
                ),
                "provider_message": (
                    provider_check.get(
                        "provider_message"
                    )
                ),
                "withdrawal_status": (
                    withdrawal.status
                ),
                "funds_reserved": True,
                "safe_to_cancel": False,
                "reference": (
                    provider_reference
                    or None
                ),
                "next_action": (
                    "retry_provider_check"
                ),
            }, provider_check.get(
                "status_code",
                503,
            )

        if provider_check.get(
            "transfer_exists"
        ):
            # If Paystack knows about the transfer,
            # never credit the artisan wallet from
            # this cancellation route.
            provider_transfer_code = (
                provider_check.get(
                    "transfer_code"
                )
            )

            if (
                provider_transfer_code
                and not withdrawal.transfer_code
            ):
                withdrawal.transfer_code = (
                    provider_transfer_code
                )

            if transaction:
                transaction.provider_reference = (
                    provider_check.get(
                        "reference"
                    )
                    or provider_reference
                )

            try:
                db.session.commit()
            except Exception:
                db.session.rollback()

            return {
                "success": False,
                "code": (
                    "PAYOUT_TRANSFER_ALREADY_EXISTS"
                ),
                "message": (
                    "Paystack has a transfer for "
                    "this withdrawal. ServiceFlow "
                    "did not return the reserved "
                    "funds. Verify the transfer "
                    "instead."
                ),
                "provider_status": (
                    provider_check.get(
                        "provider_status"
                    )
                ),
                "transfer_code": (
                    provider_check.get(
                        "transfer_code"
                    )
                ),
                "reference": (
                    provider_check.get(
                        "reference"
                    )
                    or provider_reference
                ),
                "withdrawal_status": (
                    withdrawal.status
                ),
                "funds_reserved": True,
                "safe_to_cancel": False,
                "next_action": (
                    "verify_existing_transfer"
                ),
            }, 409

        if not provider_check.get(
            "safe_to_cancel"
        ):
            return {
                "success": False,
                "code": (
                    "PAYOUT_CANCELLATION_NOT_SAFE"
                ),
                "message": (
                    "The withdrawal could not be "
                    "safely cancelled."
                ),
                "withdrawal_status": (
                    withdrawal.status
                ),
                "funds_reserved": True,
                "safe_to_cancel": False,
            }, 409

        # Re-read the withdrawal after the provider
        # check. Never refund if its state changed
        # while the external verification was in
        # progress.
        db.session.expire(
            withdrawal,
        )

        current_withdrawal = (
            db.session.get(
                Withdrawal,
                withdrawal.id,
            )
        )

        if (
            not current_withdrawal
            or current_withdrawal.status
            != "approved"
            or current_withdrawal.transfer_code
        ):
            return {
                "success": False,
                "code": (
                    "PAYOUT_STATE_CHANGED"
                ),
                "message": (
                    "The withdrawal changed while "
                    "ServiceFlow was checking "
                    "Paystack. No funds were "
                    "returned."
                ),
                "funds_reserved": True,
                "safe_to_cancel": False,
                "next_action": (
                    "refresh_withdrawal"
                ),
            }, 409

        result = reject_withdrawal(
            withdrawal_id=(
                current_withdrawal.id
            ),
            admin_id=g.current_user.id,
            reason=(
                reason
                or (
                    "Approved withdrawal "
                    "cancelled after Paystack "
                    "confirmed that no transfer "
                    "exists."
                )
            ),
            provider_transfer_absent=True,
        )

        if result.get("success"):
            result[
                "provider_check"
            ] = {
                "transfer_exists": False,
                "safe_to_cancel": True,
                "provider_status": (
                    provider_check.get(
                        "provider_status"
                    )
                ),
                "reference": (
                    provider_reference
                    or None
                ),
            }

    else:
        return {
            "success": False,
            "message": (
                "This withdrawal cannot be "
                "rejected or cancelled from its "
                f"current {withdrawal.status} "
                "state."
            ),
            "withdrawal_status": (
                withdrawal.status
            ),
            "funds_reserved": (
                withdrawal.status
                not in {
                    "failed",
                    "paid",
                    "rejected",
                }
            ),
        }, 409

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to reject or cancel "
                    "withdrawal."
                ),
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            (
                "Withdrawal rejected "
                "successfully."
            ),
        ),
        "already_rejected": bool(
            result.get(
                "already_rejected",
                False,
            )
        ),
        "previous_status": result.get(
            "previous_status"
        ),
        "withdrawal": result.get(
            "withdrawal_data",
        ),
        "transaction": result.get(
            "transaction_data",
        ),
        "wallet": result.get(
            "wallet_data",
        ),
        "provider_check": result.get(
            "provider_check"
        ),
    }, 200


# ==========================
# Pay Approved Withdrawal
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/pay",
    methods=["POST"],
)
@admin_required
def pay_admin_withdrawal(
    withdrawal_id,
):
    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": (
                "Withdrawal not found."
            ),
        }, 404

    # --------------------------------------
    # Idempotent already-completed states
    # --------------------------------------
    if withdrawal.status == "paid":
        return {
            "success": True,
            "message": (
                "This withdrawal has already "
                "been paid."
            ),
            "already_initiated": True,
            "withdrawal": (
                withdrawal_to_dict(
                    withdrawal,
                )
            ),
        }, 200

    if withdrawal.status == "processing":
        return {
            "success": True,
            "message": (
                "This withdrawal is already "
                "processing. Verify the existing "
                "Paystack transfer instead of "
                "initiating another one."
            ),
            "already_initiated": True,
            "next_action": (
                "verify_existing_transfer"
            ),
            "withdrawal": (
                withdrawal_to_dict(
                    withdrawal,
                )
            ),
        }, 200

    if withdrawal.status != "approved":
        return {
            "success": False,
            "message": (
                "Only approved withdrawals "
                "can be sent to Paystack."
            ),
            "withdrawal_status": (
                withdrawal.status
            ),
            "funds_reserved": (
                withdrawal.status
                not in {
                    "rejected",
                    "failed",
                    "paid",
                }
            ),
        }, 409

    # If a provider transfer code already exists,
    # never create a second transfer.
    if withdrawal.transfer_code:
        return {
            "success": True,
            "message": (
                "This withdrawal already has a "
                "Paystack transfer. Verify or "
                "finalize the existing transfer."
            ),
            "already_initiated": True,
            "next_action": (
                "verify_or_finalize"
            ),
            "withdrawal": (
                withdrawal_to_dict(
                    withdrawal,
                )
            ),
        }, 200

    # --------------------------------------
    # Stable idempotency reference
    # --------------------------------------
    reference_result = (
        ensure_withdrawal_transfer_reference(
            withdrawal.id,
        )
    )

    if not reference_result.get(
        "success"
    ):
        return {
            "success": False,
            "message": reference_result.get(
                "message",
                (
                    "Unable to prepare payout "
                    "reference."
                ),
            ),
            "withdrawal_status": (
                withdrawal.status
            ),
            "funds_reserved": True,
        }, reference_result.get(
            "status_code",
            500,
        )

    provider_reference = (
        reference_result[
            "provider_reference"
        ]
    )

    # --------------------------------------
    # Initiate provider transfer
    # --------------------------------------
    provider_result = (
        initiate_withdrawal_transfer(
            withdrawal,
            reference=provider_reference,
        )
    )

    if not provider_result.get(
        "success"
    ):
        error_code = provider_result.get(
            "error_code",
            "PAYOUT_PROVIDER_ERROR",
        )

        audit_result = record_withdrawal_event(
            withdrawal,
            "payout_provider_rejected",
            actor_user_id=g.current_user.id,
            actor_role="admin",
            previous_status=withdrawal.status,
            new_status=withdrawal.status,
            provider="paystack",
            provider_reference=provider_reference,
            reason=provider_result.get(
                "message"
            ),
            event_metadata={
                "error_code": error_code,
                "retryable": bool(
                    provider_result.get(
                        "retryable",
                        False,
                    )
                ),
                "action_required": (
                    provider_result.get(
                        "action_required"
                    )
                ),
            },
            notification_title=(
                "Payout could not be sent"
            ),
            notification_message=(
                f"Your {float(withdrawal.amount):.2f} "
                f"{withdrawal.currency} withdrawal "
                f"request #{withdrawal.id} could "
                "not be sent yet. Your funds "
                "remain safely reserved."
            ),
            commit=True,
        )

        if not audit_result.get("success"):
            return {
                "success": False,
                "message": (
                    "The payout provider rejected "
                    "the transfer, and ServiceFlow "
                    "could not record the audit event."
                ),
            }, 500

        return {
            "success": False,
            "code": error_code,
            "message": provider_result.get(
                "message",
                "Unable to initiate transfer.",
            ),
            "provider_message": (
                provider_result.get(
                    "provider_message"
                )
            ),
            "withdrawal_status": (
                withdrawal.status
            ),
            "funds_reserved": True,
            "retryable": bool(
                provider_result.get(
                    "retryable",
                    False,
                )
            ),
            "action_required": (
                provider_result.get(
                    "action_required"
                )
            ),
            "transfer_may_exist": bool(
                provider_result.get(
                    "transfer_may_exist",
                    False,
                )
            ),
            "reference": (
                provider_reference
            ),
        }, provider_result.get(
            "status_code",
            502,
        )

    provider_status = (
        provider_result.get(
            "provider_status",
            "unknown",
        )
    )

    requires_otp = bool(
        provider_result.get(
            "requires_otp",
        )
    )

    record_result = (
        record_withdrawal_transfer(
            withdrawal_id=withdrawal.id,
            transfer_code=provider_result[
                "transfer_code"
            ],
            provider_reference=(
                provider_result.get(
                    "reference",
                )
                or provider_reference
            ),
            mark_processing=(
                not requires_otp
            ),
        actor_user_id=g.current_user.id,
        )
    )

    if not record_result.get("success"):
        return {
            "success": False,
            "code": (
                "PAYOUT_LOCAL_SAVE_FAILED"
            ),
            "message": record_result.get(
                "message",
                (
                    "Paystack created the transfer, "
                    "but ServiceFlow could not save "
                    "its transfer details."
                ),
            ),
            "withdrawal_status": (
                withdrawal.status
            ),
            "funds_reserved": True,
            "retryable": False,
            "action_required": (
                "verify_existing_transfer"
            ),
            "transfer_may_exist": True,
            "reference": (
                provider_result.get(
                    "reference"
                )
                or provider_reference
            ),
        }, record_result.get(
            "status_code",
            500,
        )

    return {
        "success": True,
        "message": (
            "Paystack requires transfer OTP."
            if requires_otp
            else
            "Withdrawal transfer initiated."
        ),
        "already_initiated": False,
        "requires_otp": requires_otp,
        "provider_status": provider_status,
        "transfer_code": (
            provider_result.get(
                "transfer_code",
            )
        ),
        "reference": (
            provider_result.get(
                "reference",
            )
            or provider_reference
        ),
        "next_action": (
            "finalize_otp"
            if requires_otp
            else
            "verify_transfer"
        ),
        "withdrawal": record_result.get(
            "withdrawal_data",
        ),
        "transaction": record_result.get(
            "transaction_data",
        ),
    }, 202


# ==========================
# Finalize Withdrawal OTP
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/finalize",
    methods=["POST"],
)
@admin_required
def finalize_admin_withdrawal(
    withdrawal_id,
):
    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": (
                "Withdrawal not found."
            ),
        }, 404

    if withdrawal.status != "approved":
        return {
            "success": False,
            "message": (
                "Only an approved withdrawal "
                "awaiting OTP can be finalized."
            ),
        }, 409

    transfer_code = str(
        withdrawal.transfer_code
        or ""
    ).strip()

    if not transfer_code:
        return {
            "success": False,
            "message": (
                "This withdrawal does not have "
                "a Paystack transfer code."
            ),
        }, 409

    data = request.get_json(
        silent=True,
    ) or {}

    otp = str(
        data.get(
            "otp",
            "",
        )
        or ""
    ).strip()

    if not otp:
        return {
            "success": False,
            "message": (
                "Transfer OTP is required."
            ),
        }, 400

    provider_result = (
        finalize_withdrawal_transfer(
            transfer_code=transfer_code,
            otp=otp,
        )
    )

    if not provider_result.get(
        "success"
    ):
        return {
            "success": False,
            "message": provider_result.get(
                "message",
                "Unable to finalize transfer.",
            ),
        }, provider_result.get(
            "status_code",
            502,
        )

    record_result = (
        record_withdrawal_transfer(
            withdrawal_id=withdrawal.id,
            transfer_code=(
                provider_result.get(
                    "transfer_code",
                )
                or transfer_code
            ),
            provider_reference=(
                provider_result.get(
                    "reference",
                )
            ),
            mark_processing=True,
            actor_user_id=g.current_user.id,
        )
    )

    if not record_result.get("success"):
        return {
            "success": False,
            "message": record_result.get(
                "message",
                (
                    "Transfer was finalized, but "
                    "ServiceFlow could not update "
                    "the withdrawal."
                ),
            ),
        }, record_result.get(
            "status_code",
            500,
        )

    return {
        "success": True,
        "message": (
            "Withdrawal transfer finalized "
            "and is processing."
        ),
        "provider_status": (
            provider_result.get(
                "provider_status",
            )
        ),
        "withdrawal": record_result.get(
            "withdrawal_data",
        ),
        "transaction": record_result.get(
            "transaction_data",
        ),
    }, 202


# ==========================
# Verify Withdrawal Transfer
# ==========================
@admin_bp.route(
    "/withdrawals/<int:withdrawal_id>/verify",
    methods=["POST"],
)
@admin_required
def verify_admin_withdrawal(
    withdrawal_id,
):
    reference_result = (
        get_withdrawal_transfer_reference(
            withdrawal_id,
        )
    )

    if not reference_result.get(
        "success"
    ):
        return {
            "success": False,
            "message": reference_result.get(
                "message",
                (
                    "Unable to load transfer "
                    "reference."
                ),
            ),
        }, reference_result.get(
            "status_code",
            400,
        )

    withdrawal = (
        reference_result[
            "withdrawal"
        ]
    )

    provider_result = (
        verify_withdrawal_transfer(
            reference_result[
                "provider_reference"
            ],
        )
    )

    if not provider_result.get(
        "success"
    ):
        return {
            "success": False,
            "message": provider_result.get(
                "message",
                (
                    "Unable to verify transfer."
                ),
            ),
        }, provider_result.get(
            "status_code",
            502,
        )

    provider_status = str(
        provider_result.get(
            "provider_status",
            "",
        )
        or ""
    ).strip().lower()

    expected_amount = float(
        withdrawal.amount
        or 0
    )

    provider_amount = (
        provider_result.get(
            "amount"
        )
    )

    provider_currency = str(
        provider_result.get(
            "currency",
            "",
        )
        or ""
    ).strip().upper()

    expected_currency = str(
        withdrawal.currency
        or "ZAR"
    ).strip().upper()

    if (
        provider_amount is not None
        and round(
            float(provider_amount),
            2,
        )
        != round(
            expected_amount,
            2,
        )
    ):
        return {
            "success": False,
            "message": (
                "Transfer amount verification "
                "failed."
            ),
        }, 409

    if (
        provider_currency
        and provider_currency
        != expected_currency
    ):
        return {
            "success": False,
            "message": (
                "Transfer currency verification "
                "failed."
            ),
        }, 409

    transfer_code = (
        provider_result.get(
            "transfer_code"
        )
        or withdrawal.transfer_code
    )

    if provider_status == "success":
        state_result = (
            mark_withdrawal_paid(
                withdrawal_id=withdrawal.id,
                transfer_code=transfer_code,
                provider_reference=(
                    provider_result.get(
                        "reference"
                    )
                ),
                actor_user_id=g.current_user.id,
            )
        )

    elif provider_status in {
        "failed",
        "reversed",
    }:
        state_result = (
            mark_withdrawal_failed(
                withdrawal_id=withdrawal.id,
                reason=(
                    "Paystack transfer "
                    f"{provider_status}."
                ),
                actor_user_id=g.current_user.id,
            )
        )

    else:
        if withdrawal.status == "approved":
            state_result = (
                record_withdrawal_transfer(
                    withdrawal_id=withdrawal.id,
                    transfer_code=transfer_code,
                    provider_reference=(
                        provider_result.get(
                            "reference"
                        )
                    ),
                    mark_processing=True,
                )
            )
        else:
            state_result = {
                "success": True,
                "withdrawal_data": (
                    withdrawal_to_dict(
                        withdrawal,
                    )
                ),
                "transaction_data": (
                    transaction_to_dict(
                        reference_result[
                            "transaction"
                        ],
                    )
                    if reference_result.get(
                        "transaction"
                    )
                    else None
                ),
            }

    if not state_result.get("success"):
        return {
            "success": False,
            "message": state_result.get(
                "message",
                (
                    "Unable to update withdrawal "
                    "status."
                ),
            ),
        }, state_result.get(
            "status_code",
            500,
        )

    return {
        "success": True,
        "message": (
            "Withdrawal transfer verified."
        ),
        "provider_status": provider_status,
        "provider": {
            "reference": (
                provider_result.get(
                    "reference"
                )
            ),
            "transfer_code": (
                transfer_code
            ),
            "amount": provider_amount,
            "currency": provider_currency,
        },
        "withdrawal": state_result.get(
            "withdrawal_data",
        ),
        "transaction": state_result.get(
            "transaction_data",
        ),
        "wallet": state_result.get(
            "wallet_data",
        ),
    }, 200