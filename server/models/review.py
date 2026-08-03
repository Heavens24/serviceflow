from database import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    rating = db.Column(
        db.Integer,
        nullable=False,
    )

    comment = db.Column(
        db.Text,
        nullable=True,
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    artisan_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    service_request_id = db.Column(
        db.Integer,
        db.ForeignKey("service_requests.id"),
        nullable=False,
        unique=True,
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    customer = db.relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="reviews_given",
    )

    artisan = db.relationship(
        "User",
        foreign_keys=[artisan_id],
        back_populates="reviews_received",
    )

    service_request = db.relationship(
        "ServiceRequest",
        back_populates="review",
    )

    def __repr__(self):
        return f"<Review {self.id}>"