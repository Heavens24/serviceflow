# server/models/payout_account.py

from database import db


class PayoutAccount(db.Model):
    __tablename__ = "payout_accounts"

    # ==========================================
    # Primary Key
    # ==========================================
    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    # ==========================================
    # Artisan
    # ==========================================
    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # ==========================================
    # Bank Account Information
    # ==========================================
    bank_name = db.Column(
        db.String(150),
        nullable=False,
    )

    bank_code = db.Column(
        db.String(50),
        nullable=False,
    )

    account_number = db.Column(
        db.String(50),
        nullable=False,
    )

    account_name = db.Column(
        db.String(150),
        nullable=False,
    )

    # ==========================================
    # Paystack Transfer Recipient
    # ==========================================
    recipient_code = db.Column(
        db.String(150),
        nullable=True,
        unique=True,
        index=True,
    )

    recipient_type = db.Column(
        db.String(50),
        nullable=False,
        default="nuban",
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="ZAR",
    )

    # ==========================================
    # Verification / Status
    # ==========================================
    is_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    # ==========================================
    # Audit
    # ==========================================
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    # ==========================================
    # Relationships
    # ==========================================
    artisan = db.relationship(
        "User",
        foreign_keys=[artisan_id],
        backref=db.backref(
            "payout_account",
            uselist=False,
        ),
    )

    # ==========================================
    # Serialization
    # ==========================================
    def to_dict(self):
        """
        Safe public representation.

        The full bank account number is deliberately
        not exposed through the API.
        """

        account_number = str(
            self.account_number or ""
        ).strip()

        if len(account_number) >= 4:
            masked_account_number = (
                "*" * (len(account_number) - 4)
                + account_number[-4:]
            )
        elif account_number:
            masked_account_number = "****"
        else:
            masked_account_number = None

        return {
            "id": self.id,
            "artisan_id": self.artisan_id,
            "bank_name": self.bank_name,
            "bank_code": self.bank_code,
            "account_number": masked_account_number,
            "account_name": self.account_name,
            "recipient_code": self.recipient_code,
            "recipient_type": self.recipient_type,
            "currency": self.currency,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }

    def __repr__(self):
        return (
            f"<PayoutAccount id={self.id} "
            f"artisan_id={self.artisan_id} "
            f"bank={self.bank_name}>"
        )