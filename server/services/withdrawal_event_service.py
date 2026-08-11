from database import db
from models.notification import Notification
from models.user import User
from models.withdrawal_audit import WithdrawalAudit


def _clean_text(value):
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def _resolve_actor_role(
    actor_user_id=None,
    actor_role=None,
):
    if actor_role:
        return str(actor_role).strip().lower()

    if actor_user_id:
        actor = db.session.get(
            User,
            actor_user_id,
        )

        if actor and actor.role:
            return str(actor.role).strip().lower()

    return "system"


def create_withdrawal_notification(
    user_id,
    title,
    message,
    notification_type="withdrawal",
):
    """
    Add an in-app notification to the current
    SQLAlchemy transaction.

    This helper deliberately does not commit so
    the notification can be saved atomically with
    the wallet/withdrawal/audit state change.
    """

    notification = Notification(
        user_id=user_id,
        title=str(title).strip(),
        message=str(message).strip(),
        notification_type=(
            str(
                notification_type
                or "withdrawal"
            )
            .strip()
            .lower()
            or "withdrawal"
        ),
        is_read=False,
    )

    db.session.add(notification)

    return notification


def record_withdrawal_event(
    withdrawal,
    event_type,
    *,
    actor_user_id=None,
    actor_role=None,
    previous_status=None,
    new_status=None,
    reason=None,
    provider="paystack",
    provider_reference=None,
    transfer_code=None,
    event_metadata=None,
    notification_title=None,
    notification_message=None,
    notification_type="withdrawal",
    commit=False,
):
    """
    Record an immutable withdrawal audit event.

    When notification_title and notification_message
    are supplied, the artisan notification is added
    to the same database transaction as the audit.
    """

    if not withdrawal:
        return {
            "success": False,
            "message": "Withdrawal is required.",
            "status_code": 400,
        }

    normalized_event_type = (
        str(event_type or "")
        .strip()
        .lower()
    )

    if not normalized_event_type:
        return {
            "success": False,
            "message": (
                "Withdrawal audit event type "
                "is required."
            ),
            "status_code": 400,
        }

    resolved_role = _resolve_actor_role(
        actor_user_id=actor_user_id,
        actor_role=actor_role,
    )

    audit = WithdrawalAudit(
        withdrawal_id=withdrawal.id,
        artisan_id=withdrawal.artisan_id,
        actor_user_id=actor_user_id,
        actor_role=resolved_role,
        event_type=normalized_event_type,
        previous_status=_clean_text(
            previous_status
        ),
        new_status=_clean_text(
            new_status
        ),
        amount=float(
            withdrawal.amount or 0
        ),
        currency=(
            str(
                withdrawal.currency
                or "ZAR"
            )
            .strip()
            .upper()
        ),
        provider=_clean_text(provider),
        provider_reference=_clean_text(
            provider_reference
        ),
        transfer_code=_clean_text(
            transfer_code
            or withdrawal.transfer_code
        ),
        reason=_clean_text(reason),
        event_metadata=(
            event_metadata
            if isinstance(
                event_metadata,
                dict,
            )
            else {}
        ),
    )

    db.session.add(audit)

    notification = None

    if (
        notification_title
        and notification_message
    ):
        notification = (
            create_withdrawal_notification(
                user_id=withdrawal.artisan_id,
                title=notification_title,
                message=notification_message,
                notification_type=notification_type,
            )
        )

    if commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return {
                "success": False,
                "message": (
                    "Unable to record withdrawal "
                    "audit event."
                ),
                "status_code": 500,
            }

    return {
        "success": True,
        "audit": audit,
        "notification": notification,
    }


def get_withdrawal_audit_events(
    withdrawal_id,
):
    events = (
        WithdrawalAudit.query.filter_by(
            withdrawal_id=withdrawal_id,
        )
        .order_by(
            WithdrawalAudit.created_at.asc(),
            WithdrawalAudit.id.asc(),
        )
        .all()
    )

    return [
        event.to_dict()
        for event in events
    ]