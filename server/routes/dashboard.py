from flask import Blueprint
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
)

from services.dashboard_service import get_dashboard


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api",
)


@dashboard_bp.route(
    "/dashboard",
    methods=["GET"],
)
@jwt_required()
def dashboard():

    user_id = get_jwt_identity()

    result = get_dashboard(user_id)

    return result, 200