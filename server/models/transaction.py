# server/models/transaction.py

from database import db


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    reference = db.Column(
        db.String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    provider = db.Column(
        db.String(50),
        nullable=False,
        default="paystack",
    )

    provider_reference = db.Column(
        db.String(150),
        nullable=True,
        index=True,
    )

    transaction_type = db.Column(
        db.String(30),
        nullable=False,
        index=True,
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    amount = db.Column(
        db.Float,
        nullable=False,
    )

    platform_fee = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    artisan_amount = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="ZAR",
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    service_request_id = db.Column(
        db.Integer,
        db.ForeignKey("service_requests.id"),
        nullable=True,
        index=True,
    )

    withdrawal_id = db.Column(
        db.Integer,
        db.ForeignKey("withdrawals.id"),
        nullable=True,
        index=True,
    )

    description = db.Column(
        db.String(255),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    customer = db.relationship(
        "User",
        foreign_keys=[customer_id],
        backref="customer_transactions",
    )

    artisan = db.relationship(
        "User",
        foreign_keys=[artisan_id],
        backref="artisan_transactions",
    )

    service_request = db.relationship(
        "ServiceRequest",
        backref="transactions",
    )

    def __repr__(self):
        return (
            f"<Transaction {self.reference} "
            f"type={self.transaction_type} "
            f"status={self.status}>"
        )