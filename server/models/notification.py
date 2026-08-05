from database import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title = db.Column(
        db.String(150),
        nullable=False,
    )

    message = db.Column(
        db.Text,
        nullable=False,
    )

    notification_type = db.Column(
        db.String(50),
        nullable=False,
        default="general",
        server_default="general",
    )

    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default=db.text("false"),
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )

    # ==========================
    # Relationships
    # ==========================
    user = db.relationship(
        "User",
        back_populates="notifications",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type,
            "is_read": self.is_read,
            "created_at": self.created_at,
        }

    def __repr__(self):
        return (
            f"<Notification "
            f"id={self.id} "
            f"type={self.notification_type} "
            f"user={self.user_id}>"
        )