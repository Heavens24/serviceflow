# server/models/wallet.py

from database import db


class Wallet(db.Model):
    __tablename__ = "wallets"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    available_balance = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    pending_balance = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    total_earned = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    total_withdrawn = db.Column(
        db.Float,
        nullable=False,
        default=0.0,
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="ZAR",
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

    user = db.relationship(
        "User",
        backref=db.backref(
            "wallet",
            uselist=False,
            cascade="all, delete-orphan",
        ),
    )

    def __repr__(self):
        return (
            f"<Wallet user_id={self.user_id} "
            f"available={self.available_balance}>"
        )