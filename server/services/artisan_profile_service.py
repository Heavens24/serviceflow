from sqlalchemy import func

from database import db
from models.artisan_profile import ArtisanProfile
from models.review import Review
from models.service_request import ServiceRequest
from models.user import User


ALLOWED_AVAILABILITY_VALUES = {
    "Available",
    "Busy",
    "Unavailable",
}

MAX_BIO_LENGTH = 2000
MAX_SKILLS_LENGTH = 1000
MAX_PROFILE_IMAGE_LENGTH = 255
MAX_EXPERIENCE_YEARS = 80
MAX_HOURLY_RATE = 100000


# ==========================
# Helper Functions
# ==========================
def parse_user_id(user_id):
    """
    Convert a JWT identity into a valid integer.
    """

    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def clean_optional_text(
    value,
    maximum_length,
):
    """
    Clean an optional text field.

    Returns:
        (cleaned_value, error_message)
    """

    if value is None:
        return None, None

    cleaned_value = str(value).strip()

    if not cleaned_value:
        return None, None

    if len(cleaned_value) > maximum_length:
        return (
            None,
            (
                f"Value cannot exceed "
                f"{maximum_length} characters."
            ),
        )

    return cleaned_value, None


def get_artisan_statistics(artisan_id):
    """
    Return completed-job and review statistics.
    """

    completed_jobs = (
        ServiceRequest.query
        .filter_by(
            artisan_id=artisan_id,
            status="confirmed",
        )
        .count()
    )

    rating_summary = (
        db.session.query(
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(
            Review.artisan_id == artisan_id,
        )
        .first()
    )

    average_rating = 0
    total_reviews = 0

    if rating_summary:
        average_value, review_count = rating_summary

        total_reviews = int(
            review_count or 0,
        )

        if average_value is not None:
            average_rating = round(
                float(average_value),
                1,
            )

    return {
        "completed_jobs": completed_jobs,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
    }


def artisan_profile_to_dict(
    profile,
    include_private=False,
):
    """
    Convert an artisan profile into a dictionary.

    Public responses exclude private contact details.
    The logged-in artisan's own response may include them.
    """

    statistics = get_artisan_statistics(
        profile.user_id,
    )

    profile_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.user.full_name,
        "city": profile.user.city,
        "bio": profile.bio,
        "skills": profile.skills,
        "experience_years": (
            profile.experience_years or 0
        ),
        "hourly_rate": profile.hourly_rate,
        "availability": (
            profile.availability or "Available"
        ),
        "profile_image": profile.profile_image,
        "average_rating": (
            statistics["average_rating"]
        ),
        "total_reviews": (
            statistics["total_reviews"]
        ),
        "completed_jobs": (
            statistics["completed_jobs"]
        ),
        "created_at": profile.created_at,
    }

    if include_private:
        profile_data.update(
            {
                "email": profile.user.email,
                "phone": profile.user.phone,
            },
        )

    return profile_data


# ==========================
# Create or Update Profile
# ==========================
def create_or_update_profile(data, user_id):
    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans can create "
                "artisan profiles."
            ),
            "status_code": 403,
        }

    profile = (
        ArtisanProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    profile_created = False

    if not profile:
        profile = ArtisanProfile(
            user_id=user.id,
            experience_years=0,
            availability="Available",
        )

        db.session.add(profile)
        profile_created = True

    # ==========================
    # Bio Validation
    # ==========================

    if "bio" in data:
        bio, bio_error = clean_optional_text(
            data.get("bio"),
            MAX_BIO_LENGTH,
        )

        if bio_error:
            return {
                "success": False,
                "message": (
                    f"Bio {bio_error.lower()}"
                ),
                "status_code": 400,
            }

        profile.bio = bio

    # ==========================
    # Skills Validation
    # ==========================

    if "skills" in data:
        skills, skills_error = clean_optional_text(
            data.get("skills"),
            MAX_SKILLS_LENGTH,
        )

        if skills_error:
            return {
                "success": False,
                "message": (
                    f"Skills {skills_error.lower()}"
                ),
                "status_code": 400,
            }

        profile.skills = skills

    # ==========================
    # Experience Validation
    # ==========================

    if "experience_years" in data:
        experience_years = data.get(
            "experience_years",
        )

        if (
            experience_years is None
            or experience_years == ""
        ):
            experience_years = 0

        try:
            experience_years = int(
                experience_years,
            )
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": (
                    "Experience years must be "
                    "a whole number."
                ),
                "status_code": 400,
            }

        if experience_years < 0:
            return {
                "success": False,
                "message": (
                    "Experience years cannot "
                    "be negative."
                ),
                "status_code": 400,
            }

        if (
            experience_years
            > MAX_EXPERIENCE_YEARS
        ):
            return {
                "success": False,
                "message": (
                    "Experience years cannot "
                    f"exceed {MAX_EXPERIENCE_YEARS}."
                ),
                "status_code": 400,
            }

        profile.experience_years = (
            experience_years
        )

    # ==========================
    # Hourly Rate Validation
    # ==========================

    if "hourly_rate" in data:
        hourly_rate = data.get(
            "hourly_rate",
        )

        if (
            hourly_rate is None
            or hourly_rate == ""
        ):
            profile.hourly_rate = None
        else:
            try:
                hourly_rate = float(
                    hourly_rate,
                )
            except (TypeError, ValueError):
                return {
                    "success": False,
                    "message": (
                        "Hourly rate must be "
                        "a valid number."
                    ),
                    "status_code": 400,
                }

            if hourly_rate < 0:
                return {
                    "success": False,
                    "message": (
                        "Hourly rate cannot "
                        "be negative."
                    ),
                    "status_code": 400,
                }

            if hourly_rate > MAX_HOURLY_RATE:
                return {
                    "success": False,
                    "message": (
                        "Hourly rate cannot exceed "
                        f"{MAX_HOURLY_RATE}."
                    ),
                    "status_code": 400,
                }

            profile.hourly_rate = round(
                hourly_rate,
                2,
            )

    # ==========================
    # Availability Validation
    # ==========================

    if "availability" in data:
        availability = str(
            data.get("availability", ""),
        ).strip()

        availability_lookup = {
            value.lower(): value
            for value in (
                ALLOWED_AVAILABILITY_VALUES
            )
        }

        normalized_availability = (
            availability_lookup.get(
                availability.lower(),
            )
        )

        if not normalized_availability:
            return {
                "success": False,
                "message": (
                    "Availability must be "
                    "Available, Busy, or Unavailable."
                ),
                "status_code": 400,
            }

        profile.availability = (
            normalized_availability
        )

    # ==========================
    # Profile Image Validation
    # ==========================

    if "profile_image" in data:
        profile_image, image_error = (
            clean_optional_text(
                data.get("profile_image"),
                MAX_PROFILE_IMAGE_LENGTH,
            )
        )

        if image_error:
            return {
                "success": False,
                "message": (
                    "Profile image URL cannot exceed "
                    f"{MAX_PROFILE_IMAGE_LENGTH} "
                    "characters."
                ),
                "status_code": 400,
            }

        profile.profile_image = profile_image

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to save the artisan profile."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Artisan profile created successfully."
            if profile_created
            else "Artisan profile updated successfully."
        ),
        "profile": artisan_profile_to_dict(
            profile,
            include_private=True,
        ),
    }


# ==========================
# Get Logged-In Profile
# ==========================
def get_my_profile(user_id):
    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid user identity.",
            "status_code": 401,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return {
            "success": False,
            "message": "User not found.",
            "status_code": 404,
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": (
                "Only artisans have artisan profiles."
            ),
            "status_code": 403,
        }

    profile = (
        ArtisanProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    if not profile:
        return {
            "success": False,
            "message": (
                "Artisan profile not found."
            ),
            "status_code": 404,
        }

    return {
        "success": True,
        "profile": artisan_profile_to_dict(
            profile,
            include_private=True,
        ),
    }


# ==========================
# Get All Public Profiles
# ==========================
def get_all_profiles():
    profiles = (
        ArtisanProfile.query
        .join(User)
        .filter(User.role == "artisan")
        .order_by(
            ArtisanProfile.created_at.desc(),
        )
        .all()
    )

    return {
        "success": True,
        "count": len(profiles),
        "profiles": [
            artisan_profile_to_dict(
                profile,
                include_private=False,
            )
            for profile in profiles
        ],
    }


# ==========================
# Get One Public Profile
# ==========================
def get_profile(user_id):
    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid artisan ID.",
            "status_code": 400,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user or user.role != "artisan":
        return {
            "success": False,
            "message": "Artisan not found.",
            "status_code": 404,
        }

    profile = (
        ArtisanProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    if not profile:
        return {
            "success": False,
            "message": (
                "Artisan profile not found."
            ),
            "status_code": 404,
        }

    return {
        "success": True,
        "profile": artisan_profile_to_dict(
            profile,
            include_private=False,
        ),
    }