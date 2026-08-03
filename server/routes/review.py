from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.review_service import (
    create_review,
    get_review,
    get_artisan_reviews,
)

review_bp = Blueprint(
    "reviews",
    __name__,
    url_prefix="/api",
)


@review_bp.route("/reviews", methods=["POST"])
@jwt_required()
def create_review_route():
    data = request.get_json()

    if not data:
        return {
            "success": False,
            "message": "Request body is required.",
        }, 400

    customer_id = get_jwt_identity()

    result = create_review(
        data,
        customer_id,
    )

    status = 201 if result["success"] else 400

    return result, status


@review_bp.route("/reviews/<int:review_id>", methods=["GET"])
@jwt_required()
def get_review_route(review_id):
    result = get_review(review_id)

    status = 200 if result["success"] else 404

    return result, status


@review_bp.route("/artisans/<int:artisan_id>/reviews", methods=["GET"])
@jwt_required()
def get_artisan_reviews_route(artisan_id):
    result = get_artisan_reviews(artisan_id)

    status = 200 if result["success"] else 404

    return result, status