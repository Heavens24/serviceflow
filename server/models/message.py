from database import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    service_request_id = db.Column(
        db.Integer,
        db.ForeignKey("service_requests.id"),
        nullable=False,
        index=True,
    )

    sender_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    receiver_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    message = db.Column(
        db.Text,
        nullable=False,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "service_request_id": self.service_request_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message": self.message,
            "created_at": self.created_at,
        }

    def __repr__(self):
        return (
            f"<Message "
            f"id={self.id} "
            f"request={self.service_request_id} "
            f"sender={self.sender_id}>"
        )