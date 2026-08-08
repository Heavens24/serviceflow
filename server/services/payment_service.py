import json
from decimal import (
    Decimal,
    InvalidOperation,
    ROUND_HALF_UP,
)
from uuid import uuid4

import requests
from flask import current_app

from database import db
from models.service_request import ServiceRequest
from models.transaction import Transaction
from models.user import User
from services.wallet_service import (
    calculate_payment_split,
    get_or_create_wallet,
    transaction_to_dict,
    wallet_to_dict,
)


MONEY_PLACES = Decimal("0.01")


# ==========================
# Money Helpers
# ==========================
def to_money(value):
    try:
        amount = Decimal(
            str(value),
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return None

    return amount.quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )


def to_subunit(value):
    """
    Convert ZAR to cents.

    Example:
    R450.00 -> 45000
    """

    amount = to_money(value)

    if (
        amount is None
        or amount <= 0
    ):
        return None

    return int(
        amount * Decimal("100")
    )


def from_subunit(value):
    """
    Convert Paystack subunits back
    into ZAR.
    """

    try:
        amount = Decimal(
            str(value),
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return None

    return (
        amount / Decimal("100")
    ).quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )


# ==========================
# Reference Helper
# ==========================
def generate_payment_reference(
    service_request_id,
):
    return (
        f"SF-PAY-"
        f"{service_request_id}-"
        f"{uuid4().hex}"
    )


# ==========================
# Paystack Configuration
# ==========================
def get_paystack_config():
    enabled = bool(
        current_app.config.get(
            "PAYSTACK_ENABLED",
            False,
        )
    )

    secret_key = (
        current_app.config.get(
            "PAYSTACK_SECRET_KEY",
            "",
        )
        or ""
    ).strip()

    base_url = (
        current_app.config.get(
            "PAYSTACK_BASE_URL",
            "https://api.paystack.co",
        )
        or ""
    ).strip().rstrip("/")

    callback_url = (
        current_app.config.get(
            "PAYSTACK_CALLBACK_URL",
            "",
        )
        or ""
    ).strip()

    currency = (
        current_app.config.get(
            "FINANCE_CURRENCY",
            "ZAR",
        )
        or "ZAR"
    ).strip().upper()

    return {
        "enabled": enabled,
        "secret_key": secret_key,
        "base_url": base_url,
        "callback_url": callback_url,
        "currency": currency,
    }


def ensure_paystack_ready():
    config = get_paystack_config()

    if not config["enabled"]:
        return None, {
            "success": False,
            "message": (
                "Paystack payments are "
                "currently disabled."
            ),
            "status_code": 503,
        }

    if not config["secret_key"]:
        return None, {
            "success": False,
            "message": (
                "Paystack is not configured "
                "on the server."
            ),
            "status_code": 503,
        }

    return config, None


# ==========================
# Paystack HTTP Helper
# ==========================
def paystack_request(
    method,
    endpoint,
    json_data=None,
    timeout=20,
):
    config, error = (
        ensure_paystack_ready()
    )

    if error:
        return error

    url = (
        f"{config['base_url']}"
        f"{endpoint}"
    )

    headers = {
        "Authorization": (
            f"Bearer "
            f"{config['secret_key']}"
        ),
        "Content-Type": (
            "application/json"
        ),
        "Accept": (
            "application/json"
        ),
    }

    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json_data,
            timeout=timeout,
        )
    except requests.RequestException:
        return {
            "success": False,
            "message": (
                "Unable to connect to "
                "Paystack."
            ),
            "status_code": 502,
        }

    try:
        response_data = (
            response.json()
        )
    except ValueError:
        return {
            "success": False,
            "message": (
                "Paystack returned an "
                "invalid response."
            ),
            "status_code": 502,
        }

    if (
        not response.ok
        or not response_data.get(
            "status"
        )
    ):
        return {
            "success": False,
            "message": (
                response_data.get(
                    "message"
                )
                or
                "Paystack request failed."
            ),
            "provider_response": (
                response_data
            ),
            "status_code": 502,
        }

    return {
        "success": True,
        "data": response_data.get(
            "data",
            {},
        ),
        "provider_message": (
            response_data.get(
                "message"
            )
        ),
    }


# ==========================
# Validate Customer + Job
# ==========================
def validate_payment_job(
    service_request_id,
    customer_id,
):
    try:
        customer_id = int(
            customer_id,
        )
    except (
        TypeError,
        ValueError,
    ):
        return None, None, {
            "success": False,
            "message": (
                "Invalid user identity."
            ),
            "status_code": 401,
        }

    customer = db.session.get(
        User,
        customer_id,
    )

    if not customer:
        return None, None, {
            "success": False,
            "message": (
                "Customer not found."
            ),
            "status_code": 404,
        }

    if customer.role != "customer":
        return None, None, {
            "success": False,
            "message": (
                "Only customers can pay "
                "for service requests."
            ),
            "status_code": 403,
        }

    if customer.status != "active":
        return None, None, {
            "success": False,
            "message": (
                "Only active customers can "
                "make payments."
            ),
            "status_code": 403,
        }

    service_request = db.session.get(
        ServiceRequest,
        service_request_id,
    )

    if not service_request:
        return None, None, {
            "success": False,
            "message": (
                "Service request not found."
            ),
            "status_code": 404,
        }

    if (
        service_request.customer_id
        != customer.id
    ):
        return None, None, {
            "success": False,
            "message": (
                "You do not own this "
                "service request."
            ),
            "status_code": 403,
        }

    if not service_request.artisan_id:
        return None, None, {
            "success": False,
            "message": (
                "An artisan must accept "
                "the job before payment."
            ),
            "status_code": 409,
        }

    if service_request.status not in {
        "accepted",
        "in_progress",
        "completed",
    }:
        return None, None, {
            "success": False,
            "message": (
                "This service request is "
                "not eligible for payment."
            ),
            "status_code": 409,
        }

    return (
        customer,
        service_request,
        None,
    )


# ==========================
# Initialize Payment
# ==========================
def initialize_payment(
    service_request_id,
    customer_id,
):
    customer, service_request, error = (
        validate_payment_job(
            service_request_id,
            customer_id,
        )
    )

    if error:
        return error

    existing_successful = (
        Transaction.query.filter_by(
            service_request_id=(
                service_request.id
            ),
            transaction_type="payment",
            status="successful",
        ).first()
    )

    if existing_successful:
        return {
            "success": False,
            "message": (
                "This service request has "
                "already been paid."
            ),
            "status_code": 409,
            "transaction": (
                transaction_to_dict(
                    existing_successful,
                )
            ),
        }

    amount = to_money(
        service_request.budget,
    )

    if (
        amount is None
        or amount <= 0
    ):
        return {
            "success": False,
            "message": (
                "The service request has "
                "an invalid amount."
            ),
            "status_code": 400,
        }

    split = calculate_payment_split(
        amount,
    )

    if not split:
        return {
            "success": False,
            "message": (
                "Unable to calculate the "
                "payment split."
            ),
            "status_code": 400,
        }

    config, config_error = (
        ensure_paystack_ready()
    )

    if config_error:
        return config_error

    reference = (
        generate_payment_reference(
            service_request.id,
        )
    )

    metadata = {
        "serviceflow": True,
        "service_request_id": (
            service_request.id
        ),
        "customer_id": customer.id,
        "artisan_id": (
            service_request.artisan_id
        ),
        "platform_fee": float(
            split["platform_fee"],
        ),
        "artisan_amount": float(
            split["artisan_amount"],
        ),
    }

    payload = {
        "email": customer.email,
        "amount": str(
            to_subunit(amount),
        ),
        "currency": (
            config["currency"]
        ),
        "reference": reference,
        "metadata": json.dumps(
            metadata,
        ),
    }

    if config["callback_url"]:
        payload["callback_url"] = (
            config["callback_url"]
        )

    provider_result = (
        paystack_request(
            method="POST",
            endpoint=(
                "/transaction/initialize"
            ),
            json_data=payload,
        )
    )

    if not provider_result.get(
        "success"
    ):
        return provider_result

    provider_data = (
        provider_result.get(
            "data",
            {},
        )
    )

    provider_reference = (
        provider_data.get(
            "reference"
        )
        or reference
    )

    transaction = Transaction(
        reference=reference,
        provider="paystack",
        provider_reference=(
            provider_reference
        ),
        transaction_type="payment",
        status="pending",
        amount=float(amount),
        platform_fee=float(
            split["platform_fee"],
        ),
        artisan_amount=float(
            split["artisan_amount"],
        ),
        currency=(
            config["currency"]
        ),
        customer_id=customer.id,
        artisan_id=(
            service_request.artisan_id
        ),
        service_request_id=(
            service_request.id
        ),
        description=(
            "Paystack payment initialized "
            f"for service request "
            f"#{service_request.id}."
        ),
    )

    try:
        db.session.add(
            transaction,
        )

        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Paystack initialized the "
                "payment, but ServiceFlow "
                "could not save it."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Payment initialized "
            "successfully."
        ),
        "payment": {
            "authorization_url": (
                provider_data.get(
                    "authorization_url"
                )
            ),
            "access_code": (
                provider_data.get(
                    "access_code"
                )
            ),
            "reference": (
                provider_reference
            ),
            "amount": float(amount),
            "currency": (
                config["currency"]
            ),
            "platform_fee": float(
                split["platform_fee"],
            ),
            "artisan_amount": float(
                split["artisan_amount"],
            ),
        },
        "transaction": (
            transaction_to_dict(
                transaction,
            )
        ),
    }


# ==========================
# Verify Payment
# ==========================
def verify_payment(
    reference,
    customer_id=None,
):
    reference = str(
        reference or "",
    ).strip()

    if not reference:
        return {
            "success": False,
            "message": (
                "Payment reference "
                "is required."
            ),
            "status_code": 400,
        }

    transaction = (
        Transaction.query.filter(
            Transaction.transaction_type
            == "payment",
            (
                Transaction.reference
                == reference
            )
            |
            (
                Transaction.provider_reference
                == reference
            ),
        ).first()
    )

    if not transaction:
        return {
            "success": False,
            "message": (
                "Payment transaction "
                "was not found."
            ),
            "status_code": 404,
        }

    if customer_id is not None:
        try:
            customer_id = int(
                customer_id,
            )
        except (
            TypeError,
            ValueError,
        ):
            return {
                "success": False,
                "message": (
                    "Invalid user identity."
                ),
                "status_code": 401,
            }

        if (
            transaction.customer_id
            != customer_id
        ):
            return {
                "success": False,
                "message": (
                    "You are not authorized "
                    "to verify this payment."
                ),
                "status_code": 403,
            }

    if (
        transaction.status
        == "successful"
    ):
        return {
            "success": True,
            "message": (
                "Payment was already "
                "verified."
            ),
            "already_processed": True,
            "transaction": (
                transaction_to_dict(
                    transaction,
                )
            ),
        }

    verify_reference = (
        transaction.provider_reference
        or transaction.reference
    )

    provider_result = (
        paystack_request(
            method="GET",
            endpoint=(
                "/transaction/verify/"
                f"{verify_reference}"
            ),
        )
    )

    if not provider_result.get(
        "success"
    ):
        return provider_result

    provider_data = (
        provider_result.get(
            "data",
            {},
        )
    )

    provider_status = str(
        provider_data.get(
            "status",
            "",
        )
    ).strip().lower()

    provider_currency = str(
        provider_data.get(
            "currency",
            "",
        )
    ).strip().upper()

    provider_amount = from_subunit(
        provider_data.get(
            "amount"
        )
    )

    expected_amount = to_money(
        transaction.amount,
    )

    expected_currency = (
        transaction.currency
        or "ZAR"
    ).upper()

    if provider_status != "success":
        return {
            "success": False,
            "message": (
                "The payment has not "
                "completed successfully."
            ),
            "payment_status": (
                provider_status
                or "unknown"
            ),
            "status_code": 409,
        }

    if (
        provider_amount is None
        or provider_amount
        != expected_amount
    ):
        return {
            "success": False,
            "message": (
                "Payment amount "
                "verification failed."
            ),
            "status_code": 409,
        }

    if (
        provider_currency
        != expected_currency
    ):
        return {
            "success": False,
            "message": (
                "Payment currency "
                "verification failed."
            ),
            "status_code": 409,
        }

    service_request = db.session.get(
        ServiceRequest,
        transaction.service_request_id,
    )

    if not service_request:
        return {
            "success": False,
            "message": (
                "Linked service request "
                "was not found."
            ),
            "status_code": 404,
        }

    if (
        service_request.customer_id
        != transaction.customer_id
        or service_request.artisan_id
        != transaction.artisan_id
    ):
        return {
            "success": False,
            "message": (
                "Payment ownership "
                "verification failed."
            ),
            "status_code": 409,
        }

    wallet_result = (
        get_or_create_wallet(
            transaction.artisan_id,
            commit=False,
        )
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = (
        wallet_result["wallet"]
    )

    pending_balance = (
        to_money(
            wallet.pending_balance
        )
        or Decimal("0.00")
    )

    artisan_amount = (
        to_money(
            transaction.artisan_amount
        )
        or Decimal("0.00")
    )

    if artisan_amount <= 0:
        return {
            "success": False,
            "message": (
                "The artisan payment "
                "amount is invalid."
            ),
            "status_code": 500,
        }

    wallet.pending_balance = float(
        pending_balance
        + artisan_amount
    )

    transaction.status = (
        "successful"
    )

    transaction.provider_reference = (
        str(
            provider_data.get(
                "reference"
            )
            or verify_reference
        )
    )

    transaction.description = (
        "Paystack payment verified "
        f"for service request "
        f"#{service_request.id}."
    )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Payment was verified, "
                "but ServiceFlow could "
                "not finalize it."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Payment verified "
            "successfully."
        ),
        "already_processed": False,
        "transaction": (
            transaction_to_dict(
                transaction,
            )
        ),
        "wallet": (
            wallet_to_dict(
                wallet,
            )
        ),
        "provider": {
            "reference": (
                provider_data.get(
                    "reference"
                )
            ),
            "status": (
                provider_status
            ),
            "amount": float(
                provider_amount,
            ),
            "currency": (
                provider_currency
            ),
            "channel": (
                provider_data.get(
                    "channel"
                )
            ),
            "paid_at": (
                provider_data.get(
                    "paid_at"
                )
            ),
        },
    }