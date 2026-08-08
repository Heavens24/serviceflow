from datetime import datetime
from decimal import (
    Decimal,
    InvalidOperation,
    ROUND_HALF_UP,
)
from uuid import uuid4

from flask import current_app

from database import db
from models.transaction import Transaction
from models.user import User
from models.wallet import Wallet
from models.withdrawal import Withdrawal


MONEY_PLACES = Decimal("0.01")


# ==========================
# Money Helpers
# ==========================
def to_money(value):
    """
    Convert a value to a two-decimal Decimal.
    """

    try:
        amount = Decimal(str(value))
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


def money_to_float(value):
    amount = to_money(value)

    if amount is None:
        return 0.0

    return float(amount)


def get_commission_percent():
    """
    Return ServiceFlow's commission percentage.

    Defaults to 10% until Config contains an
    explicit SERVICEFLOW_COMMISSION_PERCENT.
    """

    raw_value = current_app.config.get(
        "SERVICEFLOW_COMMISSION_PERCENT",
        10,
    )

    try:
        commission = Decimal(
            str(raw_value),
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        commission = Decimal("10")

    if commission < 0:
        commission = Decimal("0")

    if commission > 100:
        commission = Decimal("100")

    return commission


def calculate_payment_split(amount):
    """
    Calculate gross payment, ServiceFlow fee,
    and artisan net amount.
    """

    gross_amount = to_money(amount)

    if (
        gross_amount is None
        or gross_amount <= 0
    ):
        return None

    commission_percent = (
        get_commission_percent()
    )

    platform_fee = (
        gross_amount
        * commission_percent
        / Decimal("100")
    ).quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )

    artisan_amount = (
        gross_amount - platform_fee
    ).quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )

    return {
        "gross_amount": gross_amount,
        "platform_fee": platform_fee,
        "artisan_amount": artisan_amount,
        "commission_percent": (
            commission_percent
        ),
    }


# ==========================
# Reference Helpers
# ==========================
def generate_reference(prefix):
    return (
        f"{prefix}-"
        f"{uuid4().hex}"
    )


# ==========================
# Serialization
# ==========================
def wallet_to_dict(wallet):
    if not wallet:
        return None

    return {
        "id": wallet.id,
        "user_id": wallet.user_id,
        "available_balance": (
            money_to_float(
                wallet.available_balance,
            )
        ),
        "pending_balance": (
            money_to_float(
                wallet.pending_balance,
            )
        ),
        "total_earned": (
            money_to_float(
                wallet.total_earned,
            )
        ),
        "total_withdrawn": (
            money_to_float(
                wallet.total_withdrawn,
            )
        ),
        "currency": wallet.currency,
        "created_at": (
            wallet.created_at.isoformat()
            if wallet.created_at
            else None
        ),
        "updated_at": (
            wallet.updated_at.isoformat()
            if wallet.updated_at
            else None
        ),
    }


def transaction_to_dict(transaction):
    if not transaction:
        return None

    return {
        "id": transaction.id,
        "reference": transaction.reference,
        "provider": transaction.provider,
        "provider_reference": (
            transaction.provider_reference
        ),
        "transaction_type": (
            transaction.transaction_type
        ),
        "status": transaction.status,
        "amount": money_to_float(
            transaction.amount,
        ),
        "platform_fee": money_to_float(
            transaction.platform_fee,
        ),
        "artisan_amount": money_to_float(
            transaction.artisan_amount,
        ),
        "currency": transaction.currency,
        "customer_id": transaction.customer_id,
        "artisan_id": transaction.artisan_id,
        "service_request_id": (
            transaction.service_request_id
        ),
        "withdrawal_id": (
            transaction.withdrawal_id
        ),
        "description": (
            transaction.description
        ),
        "created_at": (
            transaction.created_at.isoformat()
            if transaction.created_at
            else None
        ),
        "updated_at": (
            transaction.updated_at.isoformat()
            if transaction.updated_at
            else None
        ),
    }


def withdrawal_to_dict(withdrawal):
    if not withdrawal:
        return None

    return {
        "id": withdrawal.id,
        "artisan_id": withdrawal.artisan_id,
        "amount": money_to_float(
            withdrawal.amount,
        ),
        "currency": withdrawal.currency,
        "status": withdrawal.status,
        "recipient_code": (
            withdrawal.recipient_code
        ),
        "transfer_code": (
            withdrawal.transfer_code
        ),
        "reference": withdrawal.reference,
        "failure_reason": (
            withdrawal.failure_reason
        ),
        "requested_at": (
            withdrawal.requested_at.isoformat()
            if withdrawal.requested_at
            else None
        ),
        "approved_at": (
            withdrawal.approved_at.isoformat()
            if withdrawal.approved_at
            else None
        ),
        "processed_at": (
            withdrawal.processed_at.isoformat()
            if withdrawal.processed_at
            else None
        ),
        "approved_by": (
            withdrawal.approved_by
        ),
    }


# ==========================
# Get / Create Wallet
# ==========================
def get_or_create_wallet(
    user_id,
    commit=True,
):
    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans can have "
                "ServiceFlow wallets."
            ),
            "status_code": 403,
        }

    wallet = Wallet.query.filter_by(
        user_id=user.id,
    ).first()

    created = False

    if not wallet:
        wallet = Wallet(
            user_id=user.id,
            available_balance=0.0,
            pending_balance=0.0,
            total_earned=0.0,
            total_withdrawn=0.0,
            currency="ZAR",
        )

        db.session.add(wallet)

        created = True

        if commit:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()

                return {
                    "success": False,
                    "message": (
                        "Unable to create "
                        "the artisan wallet."
                    ),
                    "status_code": 500,
                }

    return {
        "success": True,
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
        "created": created,
    }


# ==========================
# Record Successful Payment
# ==========================
def record_successful_payment(
    service_request,
    provider_reference,
    amount=None,
    commit=True,
):
    """
    Record a verified customer payment.

    The artisan's net share is placed into
    pending_balance until the customer later
    confirms job completion.

    This function must only be called after
    the payment provider has verified payment.
    """

    if not service_request:
        return {
            "success": False,
            "message": (
                "Service request is required."
            ),
            "status_code": 400,
        }

    if not service_request.artisan_id:
        return {
            "success": False,
            "message": (
                "The service request does not "
                "have an artisan."
            ),
            "status_code": 409,
        }

    provider_reference = str(
        provider_reference or "",
    ).strip()

    if not provider_reference:
        return {
            "success": False,
            "message": (
                "Payment provider reference "
                "is required."
            ),
            "status_code": 400,
        }

    # Prevent the same provider payment from
    # being processed more than once.
    existing_reference = (
        Transaction.query.filter_by(
            provider_reference=(
                provider_reference
            ),
            transaction_type="payment",
            status="successful",
        ).first()
    )

    if existing_reference:
        return {
            "success": True,
            "message": (
                "Payment was already recorded."
            ),
            "already_processed": True,
            "transaction": (
                existing_reference
            ),
            "transaction_data": (
                transaction_to_dict(
                    existing_reference,
                )
            ),
        }

    # A job should have only one successful
    # customer payment.
    existing_job_payment = (
        Transaction.query.filter_by(
            service_request_id=(
                service_request.id
            ),
            transaction_type="payment",
            status="successful",
        ).first()
    )

    if existing_job_payment:
        return {
            "success": True,
            "message": (
                "This service request already "
                "has a successful payment."
            ),
            "already_processed": True,
            "transaction": (
                existing_job_payment
            ),
            "transaction_data": (
                transaction_to_dict(
                    existing_job_payment,
                )
            ),
        }

    gross_value = (
        service_request.budget
        if amount is None
        else amount
    )

    split = calculate_payment_split(
        gross_value,
    )

    if not split:
        return {
            "success": False,
            "message": (
                "Payment amount must be "
                "greater than zero."
            ),
            "status_code": 400,
        }

    wallet_result = get_or_create_wallet(
        service_request.artisan_id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    current_pending = to_money(
        wallet.pending_balance,
    ) or Decimal("0.00")

    wallet.pending_balance = float(
        current_pending
        + split["artisan_amount"]
    )

    transaction = Transaction(
        reference=generate_reference(
            "PAY",
        ),
        provider="paystack",
        provider_reference=(
            provider_reference
        ),
        transaction_type="payment",
        status="successful",
        amount=float(
            split["gross_amount"],
        ),
        platform_fee=float(
            split["platform_fee"],
        ),
        artisan_amount=float(
            split["artisan_amount"],
        ),
        currency="ZAR",
        customer_id=(
            service_request.customer_id
        ),
        artisan_id=(
            service_request.artisan_id
        ),
        service_request_id=(
            service_request.id
        ),
        description=(
            "Verified customer payment "
            f"for service request "
            f"#{service_request.id}."
        ),
    )

    db.session.add(transaction)

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to record "
                    "the payment."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Payment recorded successfully."
        ),
        "already_processed": False,
        "transaction": transaction,
        "transaction_data": (
            transaction_to_dict(
                transaction,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
        "split": {
            "gross_amount": float(
                split["gross_amount"],
            ),
            "platform_fee": float(
                split["platform_fee"],
            ),
            "artisan_amount": float(
                split["artisan_amount"],
            ),
            "commission_percent": float(
                split[
                    "commission_percent"
                ],
            ),
        },
    }


# ==========================
# Release Confirmed Earnings
# ==========================
def release_confirmed_job_earnings(
    service_request,
    commit=True,
):
    """
    Move an artisan's paid job earnings from
    pending_balance to available_balance.

    This is idempotent. Repeating the call for
    the same service request will not credit
    the artisan twice.
    """

    if not service_request:
        return {
            "success": False,
            "message": (
                "Service request is required."
            ),
            "status_code": 400,
        }

    if not service_request.artisan_id:
        return {
            "success": False,
            "message": (
                "This service request has "
                "no artisan."
            ),
            "status_code": 409,
        }

    existing_release = (
        Transaction.query.filter_by(
            service_request_id=(
                service_request.id
            ),
            transaction_type="earning",
            status="successful",
        ).first()
    )

    if existing_release:
        return {
            "success": True,
            "message": (
                "Job earnings were already "
                "released."
            ),
            "already_released": True,
            "transaction": existing_release,
            "transaction_data": (
                transaction_to_dict(
                    existing_release,
                )
            ),
        }

    payment = (
        Transaction.query.filter_by(
            service_request_id=(
                service_request.id
            ),
            transaction_type="payment",
            status="successful",
        ).first()
    )

    if not payment:
        return {
            "success": False,
            "message": (
                "This job does not have a "
                "verified successful payment."
            ),
            "status_code": 409,
        }

    wallet_result = get_or_create_wallet(
        service_request.artisan_id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    artisan_amount = to_money(
        payment.artisan_amount,
    ) or Decimal("0.00")

    pending_balance = to_money(
        wallet.pending_balance,
    ) or Decimal("0.00")

    available_balance = to_money(
        wallet.available_balance,
    ) or Decimal("0.00")

    total_earned = to_money(
        wallet.total_earned,
    ) or Decimal("0.00")

    if pending_balance < artisan_amount:
        return {
            "success": False,
            "message": (
                "The artisan wallet does not "
                "contain enough pending funds "
                "for this job."
            ),
            "status_code": 409,
        }

    wallet.pending_balance = float(
        pending_balance - artisan_amount
    )

    wallet.available_balance = float(
        available_balance + artisan_amount
    )

    wallet.total_earned = float(
        total_earned + artisan_amount
    )

    earning = Transaction(
        reference=generate_reference(
            "EARN",
        ),
        provider="serviceflow",
        provider_reference=(
            payment.provider_reference
        ),
        transaction_type="earning",
        status="successful",
        amount=float(
            artisan_amount,
        ),
        platform_fee=0.0,
        artisan_amount=float(
            artisan_amount,
        ),
        currency=wallet.currency,
        customer_id=(
            service_request.customer_id
        ),
        artisan_id=(
            service_request.artisan_id
        ),
        service_request_id=(
            service_request.id
        ),
        description=(
            "Artisan earnings released "
            f"for confirmed service request "
            f"#{service_request.id}."
        ),
    )

    db.session.add(earning)

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to release "
                    "artisan earnings."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Artisan earnings released "
            "successfully."
        ),
        "already_released": False,
        "transaction": earning,
        "transaction_data": (
            transaction_to_dict(
                earning,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }


# ==========================
# Request Withdrawal
# ==========================
def create_withdrawal_request(
    artisan_id,
    amount,
    recipient_code=None,
    commit=True,
):
    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return {
            "success": False,
            "message": "Artisan not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans can request "
                "withdrawals."
            ),
            "status_code": 403,
        }

    if artisan.status != "active":
        return {
            "success": False,
            "message": (
                "Only active artisan accounts "
                "can request withdrawals."
            ),
            "status_code": 403,
        }

    withdrawal_amount = to_money(
        amount,
    )

    if (
        withdrawal_amount is None
        or withdrawal_amount <= 0
    ):
        return {
            "success": False,
            "message": (
                "Withdrawal amount must be "
                "greater than zero."
            ),
            "status_code": 400,
        }

    wallet_result = get_or_create_wallet(
        artisan.id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    available_balance = to_money(
        wallet.available_balance,
    ) or Decimal("0.00")

    if withdrawal_amount > available_balance:
        return {
            "success": False,
            "message": (
                "Insufficient available "
                "wallet balance."
            ),
            "status_code": 409,
        }

    # Reserve funds immediately so the same
    # balance cannot be withdrawn twice.
    wallet.available_balance = float(
        available_balance
        - withdrawal_amount
    )

    reference = generate_reference(
        "WD",
    )

    withdrawal = Withdrawal(
        artisan_id=artisan.id,
        amount=float(
            withdrawal_amount,
        ),
        currency=wallet.currency,
        status="pending",
        recipient_code=(
            str(recipient_code).strip()
            if recipient_code
            else None
        ),
        reference=reference,
    )

    db.session.add(withdrawal)

    try:
        # We need the withdrawal ID before
        # creating its linked transaction.
        db.session.flush()

        transaction = Transaction(
            reference=generate_reference(
                "WDTXN",
            ),
            provider="paystack",
            transaction_type="withdrawal",
            status="pending",
            amount=float(
                withdrawal_amount,
            ),
            platform_fee=0.0,
            artisan_amount=float(
                withdrawal_amount,
            ),
            currency=wallet.currency,
            artisan_id=artisan.id,
            withdrawal_id=withdrawal.id,
            description=(
                "Artisan withdrawal request "
                f"#{withdrawal.id}."
            ),
        )

        db.session.add(transaction)

        if commit:
            db.session.commit()

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to create the "
                "withdrawal request."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Withdrawal request created "
            "successfully."
        ),
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "transaction": transaction,
        "transaction_data": (
            transaction_to_dict(
                transaction,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }


# ==========================
# Approve Withdrawal
# ==========================
def approve_withdrawal(
    withdrawal_id,
    admin_id,
    commit=True,
):
    admin = db.session.get(
        User,
        admin_id,
    )

    if (
        not admin
        or admin.role != "admin"
        or admin.status != "active"
    ):
        return {
            "success": False,
            "message": (
                "Active administrator access "
                "is required."
            ),
            "status_code": 403,
        }

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
            "status_code": 404,
        }

    if withdrawal.status != "pending":
        return {
            "success": False,
            "message": (
                "Only pending withdrawals "
                "can be approved."
            ),
            "status_code": 409,
        }

    withdrawal.status = "approved"
    withdrawal.approved_by = admin.id
    withdrawal.approved_at = (
        datetime.utcnow()
    )
    withdrawal.failure_reason = None

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to approve "
                    "the withdrawal."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal approved successfully."
        ),
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
    }


# ==========================
# Reject Withdrawal
# ==========================
def reject_withdrawal(
    withdrawal_id,
    admin_id,
    reason=None,
    commit=True,
):
    admin = db.session.get(
        User,
        admin_id,
    )

    if (
        not admin
        or admin.role != "admin"
        or admin.status != "active"
    ):
        return {
            "success": False,
            "message": (
                "Active administrator access "
                "is required."
            ),
            "status_code": 403,
        }

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
            "status_code": 404,
        }

    if withdrawal.status != "pending":
        return {
            "success": False,
            "message": (
                "Only pending withdrawals "
                "can be rejected."
            ),
            "status_code": 409,
        }

    wallet_result = get_or_create_wallet(
        withdrawal.artisan_id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    available_balance = to_money(
        wallet.available_balance,
    ) or Decimal("0.00")

    withdrawal_amount = to_money(
        withdrawal.amount,
    ) or Decimal("0.00")

    wallet.available_balance = float(
        available_balance
        + withdrawal_amount
    )

    withdrawal.status = "rejected"
    withdrawal.approved_by = admin.id
    withdrawal.failure_reason = (
        str(reason).strip()
        if reason
        else "Rejected by administrator."
    )

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    if transaction:
        transaction.status = "failed"
        transaction.description = (
            "Withdrawal rejected by "
            "administrator."
        )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to reject "
                    "the withdrawal."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal rejected and funds "
            "returned to the artisan wallet."
        ),
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }


# ==========================
# Mark Withdrawal Processing
# ==========================
def mark_withdrawal_processing(
    withdrawal_id,
    transfer_code=None,
    commit=True,
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
            "status_code": 404,
        }

    if withdrawal.status != "approved":
        return {
            "success": False,
            "message": (
                "Only approved withdrawals "
                "can begin processing."
            ),
            "status_code": 409,
        }

    withdrawal.status = "processing"

    if transfer_code:
        withdrawal.transfer_code = (
            str(transfer_code).strip()
        )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to mark withdrawal "
                    "as processing."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal is processing."
        ),
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
    }


# ==========================
# Mark Withdrawal Paid
# ==========================
def mark_withdrawal_paid(
    withdrawal_id,
    transfer_code=None,
    provider_reference=None,
    commit=True,
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
            "status_code": 404,
        }

    if withdrawal.status == "paid":
        return {
            "success": True,
            "message": (
                "Withdrawal was already "
                "marked as paid."
            ),
            "already_processed": True,
            "withdrawal": withdrawal,
            "withdrawal_data": (
                withdrawal_to_dict(
                    withdrawal,
                )
            ),
        }

    if withdrawal.status not in {
        "approved",
        "processing",
    }:
        return {
            "success": False,
            "message": (
                "This withdrawal cannot "
                "be marked as paid."
            ),
            "status_code": 409,
        }

    wallet_result = get_or_create_wallet(
        withdrawal.artisan_id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    total_withdrawn = to_money(
        wallet.total_withdrawn,
    ) or Decimal("0.00")

    amount = to_money(
        withdrawal.amount,
    ) or Decimal("0.00")

    wallet.total_withdrawn = float(
        total_withdrawn + amount
    )

    withdrawal.status = "paid"
    withdrawal.processed_at = (
        datetime.utcnow()
    )
    withdrawal.failure_reason = None

    if transfer_code:
        withdrawal.transfer_code = (
            str(transfer_code).strip()
        )

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    if transaction:
        transaction.status = "successful"

        if provider_reference:
            transaction.provider_reference = (
                str(
                    provider_reference,
                ).strip()
            )

        transaction.description = (
            "Artisan withdrawal paid "
            "successfully."
        )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to mark withdrawal "
                    "as paid."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal marked as paid."
        ),
        "already_processed": False,
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }


# ==========================
# Mark Withdrawal Failed
# ==========================
def mark_withdrawal_failed(
    withdrawal_id,
    reason=None,
    commit=True,
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
            "status_code": 404,
        }

    if withdrawal.status == "failed":
        return {
            "success": True,
            "message": (
                "Withdrawal was already "
                "marked as failed."
            ),
            "already_processed": True,
            "withdrawal": withdrawal,
            "withdrawal_data": (
                withdrawal_to_dict(
                    withdrawal,
                )
            ),
        }

    if withdrawal.status not in {
        "approved",
        "processing",
    }:
        return {
            "success": False,
            "message": (
                "This withdrawal cannot "
                "be marked as failed."
            ),
            "status_code": 409,
        }

    wallet_result = get_or_create_wallet(
        withdrawal.artisan_id,
        commit=False,
    )

    if not wallet_result.get(
        "success"
    ):
        return wallet_result

    wallet = wallet_result["wallet"]

    available_balance = to_money(
        wallet.available_balance,
    ) or Decimal("0.00")

    amount = to_money(
        withdrawal.amount,
    ) or Decimal("0.00")

    # Return reserved funds because the payout
    # did not succeed.
    wallet.available_balance = float(
        available_balance + amount
    )

    withdrawal.status = "failed"
    withdrawal.processed_at = (
        datetime.utcnow()
    )
    withdrawal.failure_reason = (
        str(reason).strip()
        if reason
        else "The payout failed."
    )

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    if transaction:
        transaction.status = "failed"
        transaction.description = (
            "Artisan withdrawal payout failed."
        )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to mark withdrawal "
                    "as failed."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal marked as failed and "
            "funds returned to the wallet."
        ),
        "already_processed": False,
        "withdrawal": withdrawal,
        "withdrawal_data": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }