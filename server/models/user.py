from database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    full_name = db.Column(
        db.String(100),
        nullable=False,
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False,
    )

    password = db.Column(
        db.String(255),
        nullable=False,
    )

    role = db.Column(
        db.String(30),
        default="customer",
    )

    phone = db.Column(
        db.String(20),
        nullable=True,
    )

    city = db.Column(
        db.String(100),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

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

    def __repr__(self):
        return f"<User {self.email}>"