from flask_jwt_extended import create_access_token

from database import db
from models.user import User
from utils.password import hash_password, verify_password


def register_user(data):
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    phone = data.get("phone", "").strip()
    city = data.get("city", "").strip()
    role = data.get("role", "customer")

    if not full_name:
        return {
            "success": False,
            "message": "Full name is required.",
        }

    if not email:
        return {
            "success": False,
            "message": "Email is required.",
        }

    if not password:
        return {
            "success": False,
            "message": "Password is required.",
        }

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists.",
        }

    user = User(
        full_name=full_name,
        email=email,
        password=hash_password(password),
        phone=phone,
        city=city,
        role=role,
    )

    db.session.add(user)
    db.session.commit()

    return {
        "success": True,
        "message": "Registration successful.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "role": user.role,
        },
    }


def login_user(data):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return {
            "success": False,
            "message": "Email is required.",
        }

    if not password:
        return {
            "success": False,
            "message": "Password is required.",
        }

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password.",
        }

    if not verify_password(password, user.password):
        return {
            "success": False,
            "message": "Invalid email or password.",
        }

    access_token = create_access_token(
        identity=str(user.id)
    )

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "city": user.city,
            "role": user.role,
        },
    }