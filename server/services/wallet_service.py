from datetime import datetime
from decimal import (
    Decimal,
    InvalidOperation,
    ROUND_HALF_UP,
)
from uuid import uuid4

from flask import current_app

from database import db
from models.payout_account import PayoutAccount
from models.transaction import Transaction
from models.user import User
from models.wallet import Wallet
from models.withdrawal import Withdrawal
from services.withdrawal_event_service import (
    record_withdrawal_event,
)


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
    commit=True,
):
    """
    Create an artisan withdrawal request.

    The payout destination is resolved entirely
    server-side from the artisan's active,
    verified payout account. The client must
    never provide or override recipient_code.
    """

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

    # --------------------------------------
    # Trusted Payout Destination
    # --------------------------------------
    payout_account = (
        PayoutAccount.query.filter_by(
            artisan_id=artisan.id,
        )
        .first()
    )

    if not payout_account:
        return {
            "success": False,
            "message": (
                "Add and verify a payout account "
                "before requesting a withdrawal."
            ),
            "status_code": 409,
        }

    if not payout_account.is_active:
        return {
            "success": False,
            "message": (
                "Your payout account is inactive. "
                "Update or reactivate it before "
                "requesting a withdrawal."
            ),
            "status_code": 409,
        }

    if not payout_account.is_verified:
        return {
            "success": False,
            "message": (
                "Your payout account must be "
                "verified before requesting a "
                "withdrawal."
            ),
            "status_code": 409,
        }

    recipient_code = str(
        payout_account.recipient_code
        or ""
    ).strip()

    if not recipient_code:
        return {
            "success": False,
            "message": (
                "Your payout account does not "
                "have a valid Paystack recipient "
                "code. Please update the payout "
                "account."
            ),
            "status_code": 409,
        }

    if (
        str(
            payout_account.currency
            or ""
        ).upper()
        != "ZAR"
    ):
        return {
            "success": False,
            "message": (
                "ServiceFlow withdrawals currently "
                "support ZAR payout accounts only."
            ),
            "status_code": 409,
        }

    if (
        str(
            payout_account.recipient_type
            or ""
        ).lower()
        != "basa"
    ):
        return {
            "success": False,
            "message": (
                "The saved payout account is not "
                "configured as a South African "
                "bank recipient."
            ),
            "status_code": 409,
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

    minimum_withdrawal = to_money(
        current_app.config.get(
            "MINIMUM_WITHDRAWAL_AMOUNT",
            50.00,
        )
    ) or Decimal("50.00")

    if (
        withdrawal_amount
        < minimum_withdrawal
    ):
        return {
            "success": False,
            "message": (
                "Minimum withdrawal amount is "
                f"{money_to_float(minimum_withdrawal):.2f} "
                "ZAR."
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
        recipient_code=recipient_code,
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

        event_result = record_withdrawal_event(
            withdrawal,
            "withdrawal_requested",
            actor_user_id=artisan.id,
            actor_role="artisan",
            previous_status=None,
            new_status="pending",
            provider="paystack",
            reason=None,
            event_metadata={
                "wallet_balance_after_reservation": (
                    float(
                        wallet.available_balance
                        or 0
                    )
                ),
            },
            notification_title=(
                "Withdrawal requested"
            ),
            notification_message=(
                f"Your {float(withdrawal.amount):.2f} "
                f"{withdrawal.currency} withdrawal "
                f"request #{withdrawal.id} was "
                "submitted successfully."
            ),
        )

        if not event_result.get("success"):
            raise RuntimeError(
                event_result.get(
                    "message",
                    "Unable to record withdrawal event.",
                )
            )

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
        "payout_account": payout_account,
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

    previous_status = withdrawal.status

    withdrawal.status = "approved"
    withdrawal.approved_by = admin.id
    withdrawal.approved_at = (
        datetime.utcnow()
    )
    withdrawal.failure_reason = None

    event_result = record_withdrawal_event(
        withdrawal,
        "withdrawal_approved",
        actor_user_id=admin.id,
        actor_role="admin",
        previous_status=previous_status,
        new_status="approved",
        provider="paystack",
        notification_title=(
            "Withdrawal approved"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} was "
            "approved and is ready for payout."
        ),
    )

    if not event_result.get("success"):
        return event_result

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
# Reject / Cancel Withdrawal
# ==========================
def reject_withdrawal(
    withdrawal_id,
    admin_id,
    reason=None,
    provider_transfer_absent=False,
    commit=True,
):
    """
    Reject a pending withdrawal or safely cancel an
    approved withdrawal.

    Pending withdrawals can be rejected immediately.

    Approved withdrawals can only be refunded when
    the caller has already confirmed that Paystack
    does not have a transfer for the withdrawal's
    provider reference.

    Rejected withdrawals are idempotent: calling this
    function again never credits the wallet twice.
    """

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

    # --------------------------------------
    # Idempotent terminal-state protection
    # --------------------------------------
    if withdrawal.status == "rejected":
        wallet_result = get_or_create_wallet(
            withdrawal.artisan_id,
            commit=False,
        )

        wallet = (
            wallet_result.get("wallet")
            if wallet_result.get("success")
            else None
        )

        transaction = (
            Transaction.query.filter_by(
                withdrawal_id=withdrawal.id,
                transaction_type="withdrawal",
            ).first()
        )

        return {
            "success": True,
            "message": (
                "Withdrawal was already rejected. "
                "No additional funds were returned."
            ),
            "already_rejected": True,
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
                if transaction
                else None
            ),
            "wallet": wallet,
            "wallet_data": (
                wallet_to_dict(wallet)
                if wallet
                else None
            ),
        }

    if withdrawal.status in {
        "processing",
        "paid",
        "failed",
    }:
        return {
            "success": False,
            "message": (
                "This withdrawal cannot be "
                "rejected or refunded from its "
                f"current {withdrawal.status} "
                "state."
            ),
            "status_code": 409,
        }

    if withdrawal.status == "approved":
        if withdrawal.transfer_code:
            return {
                "success": False,
                "message": (
                    "This approved withdrawal "
                    "already has a Paystack "
                    "transfer code. Verify the "
                    "transfer instead of refunding "
                    "the wallet."
                ),
                "status_code": 409,
            }

        if not provider_transfer_absent:
            return {
                "success": False,
                "message": (
                    "ServiceFlow must confirm "
                    "that no Paystack transfer "
                    "exists before an approved "
                    "withdrawal can be cancelled."
                ),
                "status_code": 409,
            }

    elif withdrawal.status != "pending":
        return {
            "success": False,
            "message": (
                "Only pending or safely verified "
                "approved withdrawals can be "
                "rejected."
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

    # --------------------------------------
    # Restore reserved funds exactly once
    # --------------------------------------
    wallet.available_balance = float(
        available_balance
        + withdrawal_amount
    )

    previous_status = (
        withdrawal.status
    )

    withdrawal.status = "rejected"
    withdrawal.processed_at = (
        datetime.utcnow()
    )

    # Preserve the original approver for an
    # already-approved withdrawal. For a pending
    # rejection, record the rejecting admin.
    if not withdrawal.approved_by:
        withdrawal.approved_by = (
            admin.id
        )

    withdrawal.failure_reason = (
        str(reason).strip()
        if reason
        else (
            "Cancelled by administrator."
            if previous_status == "approved"
            else "Rejected by administrator."
        )
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
            "Approved withdrawal cancelled and "
            "reserved funds returned to the "
            "artisan wallet."
            if previous_status == "approved"
            else (
                "Withdrawal rejected by "
                "administrator and reserved "
                "funds returned to the artisan "
                "wallet."
            )
        )

    event_type = (
        "withdrawal_cancelled"
        if previous_status == "approved"
        else "withdrawal_rejected"
    )

    event_result = record_withdrawal_event(
        withdrawal,
        event_type,
        actor_user_id=admin.id,
        actor_role="admin",
        previous_status=previous_status,
        new_status="rejected",
        provider="paystack",
        provider_reference=(
            transaction.provider_reference
            if transaction
            else None
        ),
        reason=withdrawal.failure_reason,
        event_metadata={
            "funds_returned": True,
            "wallet_balance_after_refund": (
                float(
                    wallet.available_balance
                    or 0
                )
            ),
        },
        notification_title=(
            "Withdrawal cancelled"
            if previous_status == "approved"
            else "Withdrawal rejected"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} was "
            + (
                "cancelled"
                if previous_status == "approved"
                else "rejected"
            )
            + ". The reserved funds were returned "
            "to your ServiceFlow wallet."
        ),
    )

    if not event_result.get("success"):
        return event_result

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to reject or cancel "
                    "the withdrawal."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Approved withdrawal cancelled and "
            "funds returned to the artisan wallet."
            if previous_status == "approved"
            else (
                "Withdrawal rejected and funds "
                "returned to the artisan wallet."
            )
        ),
        "already_rejected": False,
        "previous_status": previous_status,
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
            if transaction
            else None
        ),
        "wallet": wallet,
        "wallet_data": (
            wallet_to_dict(wallet)
        ),
    }


# ==========================
# Ensure Withdrawal Transfer Reference
# ==========================
def ensure_withdrawal_transfer_reference(
    withdrawal_id,
    commit=True,
):
    """
    Create one stable Paystack transfer reference
    per withdrawal and persist it before calling
    Paystack.

    Reusing the same reference makes repeated
    /pay requests safe against duplicate transfers.
    """

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

    if withdrawal.status not in {
        "approved",
        "processing",
    }:
        return {
            "success": False,
            "message": (
                "A transfer reference can only "
                "be prepared for an approved or "
                "processing withdrawal."
            ),
            "status_code": 409,
        }

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    if not transaction:
        return {
            "success": False,
            "message": (
                "Linked withdrawal transaction "
                "was not found."
            ),
            "status_code": 404,
        }

    existing_reference = str(
        transaction.provider_reference
        or ""
    ).strip().lower()

    if existing_reference:
        return {
            "success": True,
            "message": (
                "Existing transfer reference "
                "loaded successfully."
            ),
            "created": False,
            "withdrawal": withdrawal,
            "transaction": transaction,
            "provider_reference": (
                existing_reference
            ),
        }

    provider_reference = (
        f"sf-wd-{withdrawal.id}-"
        f"{uuid4().hex}"
    ).lower()

    transaction.provider_reference = (
        provider_reference
    )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to prepare the "
                    "withdrawal transfer "
                    "reference."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Transfer reference prepared "
            "successfully."
        ),
        "created": True,
        "withdrawal": withdrawal,
        "transaction": transaction,
        "provider_reference": (
            provider_reference
        ),
    }


# ==========================
# Record Withdrawal Transfer
# ==========================
def record_withdrawal_transfer(
    withdrawal_id,
    transfer_code,
    provider_reference=None,
    mark_processing=False,
    actor_user_id=None,
    commit=True,
):
    """
    Store Paystack transfer identifiers.

    If mark_processing is False, an approved
    withdrawal remains approved. This is useful
    when Paystack requires OTP finalization.
    """

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

    if withdrawal.status not in {
        "approved",
        "processing",
    }:
        return {
            "success": False,
            "message": (
                "Transfer details can only be "
                "stored for approved or "
                "processing withdrawals."
            ),
            "status_code": 409,
        }

    transfer_code = str(
        transfer_code
        or ""
    ).strip()

    if not transfer_code:
        return {
            "success": False,
            "message": (
                "Transfer code is required."
            ),
            "status_code": 400,
        }

    previous_status = withdrawal.status

    withdrawal.transfer_code = (
        transfer_code
    )

    if (
        mark_processing
        and withdrawal.status
        == "approved"
    ):
        withdrawal.status = "processing"

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    if transaction:
        if provider_reference:
            transaction.provider_reference = (
                str(
                    provider_reference
                ).strip()
            )

        if mark_processing:
            transaction.status = "processing"
            transaction.description = (
                "Artisan withdrawal is "
                "processing with Paystack."
            )

    event_result = record_withdrawal_event(
        withdrawal,
        (
            "payout_processing"
            if mark_processing
            else "payout_transfer_created"
        ),
        actor_user_id=actor_user_id,
        actor_role=(
            "admin"
            if actor_user_id
            else "system"
        ),
        previous_status=previous_status,
        new_status=withdrawal.status,
        provider="paystack",
        provider_reference=(
            provider_reference
            or (
                transaction.provider_reference
                if transaction
                else None
            )
        ),
        transfer_code=transfer_code,
        notification_title=(
            "Withdrawal processing"
            if mark_processing
            else "Payout initiated"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} is "
            + (
                "being processed by the payout provider."
                if mark_processing
                else "being prepared for payout."
            )
        ),
    )

    if not event_result.get("success"):
        return event_result

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to store transfer "
                    "details."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "message": (
            "Withdrawal transfer details "
            "stored successfully."
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
            if transaction
            else None
        ),
    }


# ==========================
# Get Withdrawal Transfer Reference
# ==========================
def get_withdrawal_transfer_reference(
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
            "status_code": 404,
        }

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        ).first()
    )

    provider_reference = (
        str(
            transaction.provider_reference
            or ""
        ).strip()
        if transaction
        else ""
    )

    if not provider_reference:
        return {
            "success": False,
            "message": (
                "This withdrawal does not yet "
                "have a Paystack transfer "
                "reference."
            ),
            "status_code": 409,
        }

    return {
        "success": True,
        "withdrawal": withdrawal,
        "transaction": transaction,
        "provider_reference": (
            provider_reference
        ),
    }


# ==========================
# Mark Withdrawal Processing
# ==========================
def mark_withdrawal_processing(
    withdrawal_id,
    transfer_code=None,
    actor_user_id=None,
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

    previous_status = withdrawal.status

    withdrawal.status = "processing"

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
        transaction.status = "processing"
        transaction.description = (
            "Artisan withdrawal is "
            "processing with Paystack."
        )

    event_result = record_withdrawal_event(
        withdrawal,
        "payout_processing",
        actor_user_id=actor_user_id,
        actor_role=(
            "admin"
            if actor_user_id
            else "system"
        ),
        previous_status=previous_status,
        new_status="processing",
        provider="paystack",
        provider_reference=(
            transaction.provider_reference
            if transaction
            else None
        ),
        transfer_code=withdrawal.transfer_code,
        notification_title=(
            "Withdrawal processing"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} is "
            "processing."
        ),
    )

    if not event_result.get("success"):
        return event_result

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
    actor_user_id=None,
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

    previous_status = withdrawal.status

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

    event_result = record_withdrawal_event(
        withdrawal,
        "withdrawal_paid",
        actor_user_id=actor_user_id,
        actor_role=(
            "admin"
            if actor_user_id
            else "system"
        ),
        previous_status=previous_status,
        new_status="paid",
        provider="paystack",
        provider_reference=(
            provider_reference
            or (
                transaction.provider_reference
                if transaction
                else None
            )
        ),
        transfer_code=withdrawal.transfer_code,
        event_metadata={
            "total_withdrawn_after": float(
                wallet.total_withdrawn
                or 0
            ),
        },
        notification_title=(
            "Withdrawal paid"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} was paid "
            "successfully."
        ),
    )

    if not event_result.get("success"):
        return event_result

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
    actor_user_id=None,
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

    previous_status = withdrawal.status

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

    event_result = record_withdrawal_event(
        withdrawal,
        "withdrawal_failed",
        actor_user_id=actor_user_id,
        actor_role=(
            "admin"
            if actor_user_id
            else "system"
        ),
        previous_status=previous_status,
        new_status="failed",
        provider="paystack",
        provider_reference=(
            transaction.provider_reference
            if transaction
            else None
        ),
        transfer_code=withdrawal.transfer_code,
        reason=withdrawal.failure_reason,
        event_metadata={
            "funds_returned": True,
            "wallet_balance_after_refund": float(
                wallet.available_balance
                or 0
            ),
        },
        notification_title=(
            "Withdrawal failed"
        ),
        notification_message=(
            f"Your {float(withdrawal.amount):.2f} "
            f"{withdrawal.currency} withdrawal "
            f"request #{withdrawal.id} could not "
            "be completed. The reserved funds "
            "were returned to your ServiceFlow wallet."
        ),
    )

    if not event_result.get("success"):
        return event_result

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