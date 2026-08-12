from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from services.payment_service import (
    handle_paystack_webhook_event,
    initialize_payment,
    verify_payment,
    verify_paystack_webhook_signature,
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


# ==========================
# Paystack Webhook
# ==========================

@payment_bp.route(
    "/webhook/paystack",
    methods=["POST"],
)
def paystack_webhook():
    """
    Receive Paystack payment and transfer events.

    This endpoint intentionally does not require
    a ServiceFlow JWT. Authenticity is established
    with Paystack's x-paystack-signature HMAC.
    """

    raw_body = request.get_data(
        cache=True,
        as_text=False,
    )

    signature = request.headers.get(
        "x-paystack-signature",
        "",
    )

    if not verify_paystack_webhook_signature(
        raw_body=raw_body,
        signature=signature,
    ):
        return {
            "success": False,
            "message": (
                "Invalid Paystack webhook "
                "signature."
            ),
        }, 401

    payload = request.get_json(
        silent=True,
    )

    if not isinstance(payload, dict):
        return {
            "success": False,
            "message": (
                "Webhook payload must be "
                "valid JSON."
            ),
        }, 400

    result = handle_paystack_webhook_event(
        payload,
    )

    if result.get("success"):
        return {
            "success": True,
            "message": result.get(
                "message",
                (
                    "Paystack webhook "
                    "processed successfully."
                ),
            ),
            "event": result.get(
                "event",
            ),
            "ignored": result.get(
                "ignored",
                False,
            ),
            "already_processed": (
                result.get(
                    "already_processed",
                    False,
                )
            ),
        }, 200

    status = result.get(
        "status_code",
        500,
    )

    # Valid Paystack events that could not be
    # reconciled should not be acknowledged with
    # HTTP 200. Paystack can then retry delivery.
    if status < 500:
        status = 500

    return {
        "success": False,
        "message": result.get(
            "message",
            (
                "Unable to process Paystack "
                "webhook."
            ),
        ),
    }, status
