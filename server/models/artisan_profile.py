from database import db


class ArtisanProfile(db.Model):
    __tablename__ = "artisan_profiles"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    bio = db.Column(
        db.Text,
        nullable=True,
    )

    skills = db.Column(
        db.Text,
        nullable=True,
    )

    experience_years = db.Column(
        db.Integer,
        default=0,
    )

    hourly_rate = db.Column(
        db.Float,
        nullable=True,
    )

    availability = db.Column(
        db.String(30),
        default="Available",
    )

    profile_image = db.Column(
        db.String(255),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

    user = db.relationship(
        "User",
        back_populates="artisan_profile",
    )

    def __repr__(self):
        return (
            f"<ArtisanProfile User:{self.user_id}>"
        )