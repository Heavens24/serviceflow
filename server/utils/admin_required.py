from functools import wraps

from flask import g
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from models.user import User


def admin_required(fn):
    @jwt_required()
    @wraps(fn)
    def wrapper(*args, **kwargs):

        user_id = get_jwt_identity()

        user = User.query.get(int(user_id))

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        if user.status != "active":
            return {
                "success": False,
                "message": "Your account has been suspended.",
            }, 403

        if user.role != "admin":
            return {
                "success": False,
                "message": "Administrator access required.",
            }, 403

        g.current_user = user

        return fn(*args, **kwargs)

    return wrapper