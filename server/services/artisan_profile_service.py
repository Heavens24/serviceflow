from database import db
from models.artisan_profile import ArtisanProfile
from models.review import Review
from models.service_request import ServiceRequest
from models.user import User


def artisan_profile_to_dict(profile):
    completed_jobs = ServiceRequest.query.filter_by(
        artisan_id=profile.user_id,
        status="confirmed",
    ).count()

    reviews = Review.query.filter_by(
        artisan_id=profile.user_id,
    ).all()

    total_reviews = len(reviews)

    average_rating = (
        round(
            sum(review.rating for review in reviews) / total_reviews,
            1,
        )
        if total_reviews > 0
        else 0
    )

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.user.full_name,
        "email": profile.user.email,
        "phone": profile.user.phone,
        "city": profile.user.city,
        "bio": profile.bio,
        "skills": profile.skills,
        "experience_years": profile.experience_years,
        "hourly_rate": profile.hourly_rate,
        "availability": profile.availability,
        "profile_image": profile.profile_image,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
        "completed_jobs": completed_jobs,
        "created_at": profile.created_at,
    }


def create_or_update_profile(data, user_id):
    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found.",
        }

    if user.role != "artisan":
        return {
            "success": False,
            "message": "Only artisans can have profiles.",
        }

    profile = ArtisanProfile.query.filter_by(
        user_id=user.id
    ).first()

    if not profile:
        profile = ArtisanProfile(
            user_id=user.id,
        )
        db.session.add(profile)

    profile.bio = data.get("bio", profile.bio)
    profile.skills = data.get("skills", profile.skills)
    profile.experience_years = data.get(
        "experience_years",
        profile.experience_years,
    )
    profile.hourly_rate = data.get(
        "hourly_rate",
        profile.hourly_rate,
    )
    profile.availability = data.get(
        "availability",
        profile.availability,
    )
    profile.profile_image = data.get(
        "profile_image",
        profile.profile_image,
    )

    db.session.commit()

    return {
        "success": True,
        "message": "Artisan profile saved successfully.",
        "profile": artisan_profile_to_dict(profile),
    }


def get_my_profile(user_id):
    profile = ArtisanProfile.query.filter_by(
        user_id=int(user_id)
    ).first()

    if not profile:
        return {
            "success": False,
            "message": "Profile not found.",
        }

    return {
        "success": True,
        "profile": artisan_profile_to_dict(profile),
    }


def get_all_profiles():
    profiles = ArtisanProfile.query.all()

    return {
        "success": True,
        "count": len(profiles),
        "profiles": [
            artisan_profile_to_dict(profile)
            for profile in profiles
        ],
    }


def get_profile(user_id):
    profile = ArtisanProfile.query.filter_by(
        user_id=int(user_id)
    ).first()

    if not profile:
        return {
            "success": False,
            "message": "Profile not found.",
        }

    return {
        "success": True,
        "profile": artisan_profile_to_dict(profile),
    }