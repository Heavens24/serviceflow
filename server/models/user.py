from database import db


class User(db.Model):
    __tablename__ = "users"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    # ==========================================
    # Basic Information
    # ==========================================

    full_name = db.Column(
        db.String(100),
        nullable=False,
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False,
        index=True,
    )

    password = db.Column(
        db.String(255),
        nullable=False,
    )

    phone = db.Column(
        db.String(20),
        nullable=True,
    )

    city = db.Column(
        db.String(100),
        nullable=True,
    )

    # ==========================================
    # Account Role
    # ==========================================

    # customer
    # artisan
    # admin
    role = db.Column(
        db.String(30),
        nullable=False,
        default="customer",
        index=True,
    )

    # ==========================================
    # Account Status
    # ==========================================

    # active
    # suspended
    # banned
    status = db.Column(
        db.String(20),
        nullable=False,
        default="active",
        index=True,
    )

    # ==========================================
    # Verification
    # ==========================================

    email_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
    )

    verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
    )

    # ==========================================
    # Future Subscription Support
    # ==========================================

    is_pro = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
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

    customer_requests = db.relationship(
        "ServiceRequest",
        foreign_keys="ServiceRequest.customer_id",
        lazy=True,
    )

    artisan_jobs = db.relationship(
        "ServiceRequest",
        foreign_keys="ServiceRequest.artisan_id",
        lazy=True,
    )

    reviews_given = db.relationship(
        "Review",
        foreign_keys="Review.customer_id",
        back_populates="customer",
        lazy=True,
    )

    reviews_received = db.relationship(
        "Review",
        foreign_keys="Review.artisan_id",
        back_populates="artisan",
        lazy=True,
    )

    sent_messages = db.relationship(
        "Message",
        foreign_keys="Message.sender_id",
        backref="sender",
        lazy=True,
    )

    received_messages = db.relationship(
        "Message",
        foreign_keys="Message.receiver_id",
        backref="receiver",
        lazy=True,
    )

    artisan_profile = db.relationship(
        "ArtisanProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    customer_profile = db.relationship(
        "CustomerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    notifications = db.relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy=True,
    )

    # ==========================================
    # Helper Properties
    # ==========================================

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_artisan(self):
        return self.role == "artisan"

    @property
    def is_customer(self):
        return self.role == "customer"

    @property
    def is_active(self):
        return self.status == "active"

    @property
    def is_suspended(self):
        return self.status == "suspended"

    @property
    def is_banned(self):
        return self.status == "banned"

    # ==========================================
    # Serialization
    # ==========================================

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "city": self.city,
            "role": self.role,
            "status": self.status,
            "verified": self.verified,
            "email_verified": self.email_verified,
            "is_pro": self.is_pro,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }

    def __repr__(self):
        return (
            f"<User id={self.id} "
            f"email={self.email} "
            f"role={self.role}>"
        )