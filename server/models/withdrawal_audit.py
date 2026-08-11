from database import db


class WithdrawalAudit(db.Model):
    __tablename__ = "withdrawal_audits"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    withdrawal_id = db.Column(
        db.Integer,
        db.ForeignKey("withdrawals.id"),
        nullable=False,
        index=True,
    )

    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    actor_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    actor_role = db.Column(
        db.String(30),
        nullable=False,
        default="system",
        server_default="system",
    )

    event_type = db.Column(
        db.String(60),
        nullable=False,
        index=True,
    )

    previous_status = db.Column(
        db.String(30),
        nullable=True,
    )

    new_status = db.Column(
        db.String(30),
        nullable=True,
    )

    amount = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="ZAR",
    )

    provider = db.Column(
        db.String(50),
        nullable=True,
    )

    provider_reference = db.Column(
        db.String(150),
        nullable=True,
        index=True,
    )

    transfer_code = db.Column(
        db.String(150),
        nullable=True,
    )

    reason = db.Column(
        db.Text,
        nullable=True,
    )

    event_metadata = db.Column(
        db.JSON,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        index=True,
    )

    withdrawal = db.relationship(
        "Withdrawal",
        foreign_keys=[withdrawal_id],
        backref="audit_events",
    )

    artisan = db.relationship(
        "User",
        foreign_keys=[artisan_id],
        backref="withdrawal_audit_events",
    )

    actor = db.relationship(
        "User",
        foreign_keys=[actor_user_id],
        backref="performed_withdrawal_audit_events",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "withdrawal_id": self.withdrawal_id,
            "artisan_id": self.artisan_id,
            "actor_user_id": self.actor_user_id,
            "actor_role": self.actor_role,
            "event_type": self.event_type,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "amount": float(self.amount or 0),
            "currency": self.currency,
            "provider": self.provider,
            "provider_reference": self.provider_reference,
            "transfer_code": self.transfer_code,
            "reason": self.reason,
            "event_metadata": self.event_metadata or {},
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }

    def __repr__(self):
        return (
            f"<WithdrawalAudit "
            f"id={self.id} "
            f"withdrawal={self.withdrawal_id} "
            f"event={self.event_type}>"
        )