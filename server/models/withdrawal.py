# server/models/withdrawal.py

from database import db


class Withdrawal(db.Model):
    __tablename__ = "withdrawals"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    amount = db.Column(
        db.Float,
        nullable=False,
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="ZAR",
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    recipient_code = db.Column(
        db.String(150),
        nullable=True,
    )

    transfer_code = db.Column(
        db.String(150),
        nullable=True,
        unique=True,
    )

    reference = db.Column(
        db.String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    failure_reason = db.Column(
        db.Text,
        nullable=True,
    )

    requested_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    approved_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    processed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    approved_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    artisan = db.relationship(
        "User",
        foreign_keys=[artisan_id],
        backref="withdrawal_requests",
    )

    approved_by_admin = db.relationship(
        "User",
        foreign_keys=[approved_by],
        backref="approved_withdrawals",
    )

    transactions = db.relationship(
        "Transaction",
        backref="withdrawal",
        lazy=True,
    )

    def __repr__(self):
        return (
            f"<Withdrawal {self.reference} "
            f"status={self.status}>"
        )