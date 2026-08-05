from database import db
from models.customer_profile import CustomerProfile
from models.service_request import ServiceRequest
from models.user import User


ALLOWED_CONTACT_METHODS = {
    "ServiceFlow Messages",
    "Phone",
    "Email",
}

MAX_BIO_LENGTH = 2000
MAX_PROFILE_IMAGE_LENGTH = 255


# ==========================
# Helper Functions
# ==========================
def parse_user_id(user_id):
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def clean_optional_text(
    value,
    maximum_length,
):
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


def get_customer_statistics(customer_id):
    total_jobs_posted = (
        ServiceRequest.query
        .filter_by(customer_id=customer_id)
        .count()
    )

    open_jobs = (
        ServiceRequest.query
        .filter_by(
            customer_id=customer_id,
            status="open",
        )
        .count()
    )

    active_jobs = (
        ServiceRequest.query
        .filter(
            ServiceRequest.customer_id == customer_id,
            ServiceRequest.status.in_(
                [
                    "accepted",
                    "in_progress",
                    "completed",
                ],
            ),
        )
        .count()
    )

    confirmed_jobs = (
        ServiceRequest.query
        .filter_by(
            customer_id=customer_id,
            status="confirmed",
        )
        .count()
    )

    return {
        "total_jobs_posted": total_jobs_posted,
        "open_jobs": open_jobs,
        "active_jobs": active_jobs,
        "confirmed_jobs": confirmed_jobs,
    }


def customer_profile_to_dict(
    profile,
    include_private=False,
):
    statistics = get_customer_statistics(
        profile.user_id,
    )

    profile_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.user.full_name,
        "city": profile.user.city,
        "bio": profile.bio,
        "preferred_contact_method": (
            profile.preferred_contact_method
            or "ServiceFlow Messages"
        ),
        "profile_image": profile.profile_image,
        "member_since": profile.user.created_at,
        "profile_created_at": profile.created_at,
        "profile_updated_at": profile.updated_at,
        "total_jobs_posted": (
            statistics["total_jobs_posted"]
        ),
        "open_jobs": statistics["open_jobs"],
        "active_jobs": statistics["active_jobs"],
        "confirmed_jobs": (
            statistics["confirmed_jobs"]
        ),
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

    if user.role != "customer":
        return {
            "success": False,
            "message": (
                "Only customers can create "
                "customer profiles."
            ),
            "status_code": 403,
        }

    profile = (
        CustomerProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    profile_created = False

    if not profile:
        profile = CustomerProfile(
            user_id=user.id,
            preferred_contact_method=(
                "ServiceFlow Messages"
            ),
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
    # Preferred Contact Method
    # ==========================

    if "preferred_contact_method" in data:
        contact_method = str(
            data.get(
                "preferred_contact_method",
                "",
            ),
        ).strip()

        contact_lookup = {
            method.lower(): method
            for method in ALLOWED_CONTACT_METHODS
        }

        normalized_method = (
            contact_lookup.get(
                contact_method.lower(),
            )
        )

        if not normalized_method:
            return {
                "success": False,
                "message": (
                    "Preferred contact method must be "
                    "ServiceFlow Messages, Phone, or Email."
                ),
                "status_code": 400,
            }

        profile.preferred_contact_method = (
            normalized_method
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
                    f"{MAX_PROFILE_IMAGE_LENGTH} characters."
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
                "Unable to save the customer profile."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Customer profile created successfully."
            if profile_created
            else "Customer profile updated successfully."
        ),
        "profile": customer_profile_to_dict(
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

    if user.role != "customer":
        return {
            "success": False,
            "message": (
                "Only customers have customer profiles."
            ),
            "status_code": 403,
        }

    profile = (
        CustomerProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    if not profile:
        return {
            "success": False,
            "message": "Customer profile not found.",
            "status_code": 404,
        }

    return {
        "success": True,
        "profile": customer_profile_to_dict(
            profile,
            include_private=True,
        ),
    }


# ==========================
# Get Public Profile
# ==========================
def get_profile(user_id):
    user_id = parse_user_id(user_id)

    if user_id is None:
        return {
            "success": False,
            "message": "Invalid customer ID.",
            "status_code": 400,
        }

    user = db.session.get(
        User,
        user_id,
    )

    if not user or user.role != "customer":
        return {
            "success": False,
            "message": "Customer not found.",
            "status_code": 404,
        }

    profile = (
        CustomerProfile.query
        .filter_by(user_id=user.id)
        .first()
    )

    if not profile:
        return {
            "success": False,
            "message": "Customer profile not found.",
            "status_code": 404,
        }

    return {
        "success": True,
        "profile": customer_profile_to_dict(
            profile,
            include_private=False,
        ),
    }