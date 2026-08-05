from database import db


class CustomerProfile(db.Model):
    __tablename__ = "customer_profiles"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    bio = db.Column(
        db.Text,
        nullable=True,
    )

    preferred_contact_method = db.Column(
        db.String(30),
        nullable=False,
        default="ServiceFlow Messages",
        server_default="ServiceFlow Messages",
    )

    profile_image = db.Column(
        db.String(255),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

    user = db.relationship(
        "User",
        back_populates="customer_profile",
    )

    def __repr__(self):
        return (
            f"<CustomerProfile "
            f"id={self.id} "
            f"user_id={self.user_id}>"
        )