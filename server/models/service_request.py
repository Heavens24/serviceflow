from database import db


class ServiceRequest(db.Model):
    __tablename__ = "service_requests"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    title = db.Column(
        db.String(150),
        nullable=False,
    )

    description = db.Column(
        db.Text,
        nullable=False,
    )

    category = db.Column(
        db.String(100),
        nullable=False,
    )

    location = db.Column(
        db.String(150),
        nullable=False,
    )

    budget = db.Column(
        db.Float,
        nullable=False,
    )

    status = db.Column(
        db.String(30),
        default="open",
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
    )

    accepted_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    started_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    completed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    confirmed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

    review = db.relationship(
        "Review",
        back_populates="service_request",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # NEW
    messages = db.relationship(
        "Message",
        backref="service_request",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<ServiceRequest {self.title}>"