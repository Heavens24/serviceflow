import re

from flask_jwt_extended import (
    create_access_token,
)
from sqlalchemy.exc import IntegrityError

from database import db
from models.user import User
from utils.password import (
    hash_password,
    verify_password,
)


# ==========================
# Authentication Constants
# ==========================
PUBLIC_REGISTRATION_ROLES = {
    "customer",
    "artisan",
}

VALID_ACCOUNT_STATUSES = {
    "active",
    "suspended",
    "banned",
}

EMAIL_PATTERN = re.compile(
    r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
)


# ==========================
# Serialize Auth User
# ==========================
def auth_user_to_dict(user):
    """
    Return the user fields required by the
    frontend authentication context.

    The password hash is never exposed.
    """

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "role": user.role,
        "status": user.status,
        "verified": user.verified,
        "email_verified": user.email_verified,
        "is_pro": user.is_pro,
        "created_at": (
            user.created_at.isoformat()
            if user.created_at
            else None
        ),
    }


# ==========================
# Create Access Token
# ==========================
def create_user_access_token(user):
    """
    Create a JWT containing helpful authorization
    claims.

    Protected routes must still query the database
    before performing sensitive admin operations
    because roles and account statuses may change.
    """

    return create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "status": user.status,
        },
    )


# ==========================
# Register User
# ==========================
def register_user(data):
    full_name = str(
        data.get(
            "full_name",
            "",
        ),
    ).strip()

    email = str(
        data.get(
            "email",
            "",
        ),
    ).strip().lower()

    password = str(
        data.get(
            "password",
            "",
        ),
    )

    phone = str(
        data.get(
            "phone",
            "",
        ),
    ).strip()

    city = str(
        data.get(
            "city",
            "",
        ),
    ).strip()

    role = str(
        data.get(
            "role",
            "customer",
        ),
    ).strip().lower()

    # ==========================
    # Validation
    # ==========================
    if not full_name:
        return {
            "success": False,
            "message": "Full name is required.",
        }, 400

    if len(full_name) > 100:
        return {
            "success": False,
            "message": (
                "Full name cannot exceed "
                "100 characters."
            ),
        }, 400

    if not email:
        return {
            "success": False,
            "message": "Email is required.",
        }, 400

    if len(email) > 120:
        return {
            "success": False,
            "message": (
                "Email cannot exceed "
                "120 characters."
            ),
        }, 400

    if not EMAIL_PATTERN.match(email):
        return {
            "success": False,
            "message": (
                "Please provide a valid "
                "email address."
            ),
        }, 400

    if not password:
        return {
            "success": False,
            "message": "Password is required.",
        }, 400

    if len(password) < 8:
        return {
            "success": False,
            "message": (
                "Password must contain at least "
                "8 characters."
            ),
        }, 400

    if len(password) > 128:
        return {
            "success": False,
            "message": (
                "Password cannot exceed "
                "128 characters."
            ),
        }, 400

    if role not in PUBLIC_REGISTRATION_ROLES:
        return {
            "success": False,
            "message": (
                "Account type must be either "
                "customer or artisan."
            ),
        }, 400

    if len(phone) > 20:
        return {
            "success": False,
            "message": (
                "Phone number cannot exceed "
                "20 characters."
            ),
        }, 400

    if len(city) > 100:
        return {
            "success": False,
            "message": (
                "City cannot exceed "
                "100 characters."
            ),
        }, 400

    existing_user = User.query.filter_by(
        email=email,
    ).first()

    if existing_user:
        return {
            "success": False,
            "message": (
                "An account with this email "
                "already exists."
            ),
        }, 409

    # ==========================
    # Create User
    # ==========================
    user = User(
        full_name=full_name,
        email=email,
        password=hash_password(
            password,
        ),
        phone=phone or None,
        city=city or None,
        role=role,
        status="active",
        email_verified=False,
        verified=False,
        is_pro=False,
    )

    try:
        db.session.add(user)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "An account with this email "
                "already exists."
            ),
        }, 409

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to create your account "
                "right now. Please try again."
            ),
        }, 500

    access_token = create_user_access_token(
        user,
    )

    return {
        "success": True,
        "message": "Registration successful.",
        "access_token": access_token,
        "user": auth_user_to_dict(
            user,
        ),
    }, 201


# ==========================
# Login User
# ==========================
def login_user(data):
    email = str(
        data.get(
            "email",
            "",
        ),
    ).strip().lower()

    password = str(
        data.get(
            "password",
            "",
        ),
    )

    # ==========================
    # Validation
    # ==========================
    if not email:
        return {
            "success": False,
            "message": "Email is required.",
        }, 400

    if not password:
        return {
            "success": False,
            "message": "Password is required.",
        }, 400

    user = User.query.filter_by(
        email=email,
    ).first()

    if (
        not user
        or not verify_password(
            password,
            user.password,
        )
    ):
        return {
            "success": False,
            "message": (
                "Invalid email or password."
            ),
        }, 401

    # ==========================
    # Account Status Checks
    # ==========================
    if user.status not in VALID_ACCOUNT_STATUSES:
        return {
            "success": False,
            "message": (
                "This account has an invalid status. "
                "Please contact ServiceFlow support."
            ),
            "account_status": user.status,
        }, 403

    if user.is_banned:
        return {
            "success": False,
            "message": (
                "This account has been banned. "
                "Please contact ServiceFlow support."
            ),
            "account_status": user.status,
        }, 403

    if user.is_suspended:
        return {
            "success": False,
            "message": (
                "This account is currently suspended. "
                "Please contact ServiceFlow support."
            ),
            "account_status": user.status,
        }, 403

    if not user.is_active:
        return {
            "success": False,
            "message": (
                "This account is not currently active."
            ),
            "account_status": user.status,
        }, 403

    # ==========================
    # Create Authenticated Session
    # ==========================
    access_token = create_user_access_token(
        user,
    )

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "user": auth_user_to_dict(
            user,
        ),
    }, 200