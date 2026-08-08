from flask import Blueprint
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.payment_service import (
    initialize_payment,
    verify_payment,
)


payment_bp = Blueprint(
    "payments",
    __name__,
    url_prefix="/api/payments",
)


# ==========================
# Helpers
# ==========================
def parse_user_id(user_id):
    try:
        return int(user_id)
    except (
        TypeError,
        ValueError,
    ):
        return None


def get_result_status(
    result,
    success_status=200,
    failure_status=400,
):
    """
    Return the service-provided status code
    when available.
    """

    if result.get("success"):
        return success_status

    return result.get(
        "status_code",
        failure_status,
    )


# ==========================
# Initialize Payment
# ==========================
@payment_bp.route(
    "/<int:service_request_id>/initialize",
    methods=["POST"],
)
@jwt_required()
def initialize_service_request_payment(
    service_request_id,
):
    customer_id = parse_user_id(
        get_jwt_identity(),
    )

    if customer_id is None:
        return {
            "success": False,
            "message": (
                "Invalid user identity."
            ),
        }, 401

    result = initialize_payment(
        service_request_id=(
            service_request_id
        ),
        customer_id=customer_id,
    )

    status = get_result_status(
        result,
        success_status=200,
    )

    return result, status


# ==========================
# Verify Payment
# ==========================
@payment_bp.route(
    "/verify/<string:reference>",
    methods=["GET"],
)
@jwt_required()
def verify_service_request_payment(
    reference,
):
    customer_id = parse_user_id(
        get_jwt_identity(),
    )

    if customer_id is None:
        return {
            "success": False,
            "message": (
                "Invalid user identity."
            ),
        }, 401

    result = verify_payment(
        reference=reference,
        customer_id=customer_id,
    )

    status = get_result_status(
        result,
        success_status=200,
    )

    return result, status