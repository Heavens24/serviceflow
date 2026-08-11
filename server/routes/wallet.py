from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from database import db
from models.transaction import Transaction
from models.user import User
from models.withdrawal import Withdrawal
from services.wallet_service import (
    create_withdrawal_request,
    get_or_create_wallet,
    transaction_to_dict,
    withdrawal_to_dict,
)


from services.payout_account_service import (
    get_payout_account,
    get_south_african_banks,
    save_payout_account,
    validate_south_african_bank_account,
)

wallet_bp = Blueprint(
    "wallet",
    __name__,
    url_prefix="/api",
)


# ==========================
# Helpers
# ==========================
def parse_user_id(user_id):
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def get_current_artisan():
    user_id = parse_user_id(
        get_jwt_identity(),
    )

    if user_id is None:
        return None, {
            "success": False,
            "message": (
                "Invalid user identity."
            ),
        }, 401

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return None, {
            "success": False,
            "message": (
                "User not found."
            ),
        }, 404

    if user.role != "artisan":
        return None, {
            "success": False,
            "message": (
                "Only artisans can access "
                "wallet features."
            ),
        }, 403

    if user.status != "active":
        return None, {
            "success": False,
            "message": (
                "Only active artisan accounts "
                "can access wallet features."
            ),
        }, 403

    return user, None, None


def parse_positive_integer(
    value,
    field_name,
    default,
):
    if value in {
        None,
        "",
    }:
        return default, None

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        return None, {
            "success": False,
            "message": (
                f"{field_name} must be "
                "a valid integer."
            ),
        }

    if parsed_value <= 0:
        return None, {
            "success": False,
            "message": (
                f"{field_name} must be "
                "greater than zero."
            ),
        }

    return parsed_value, None


# ==========================
# Get Wallet
# ==========================
@wallet_bp.route(
    "/wallet",
    methods=["GET"],
)
@jwt_required()
def get_wallet():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    result = get_or_create_wallet(
        artisan.id,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                "Unable to load wallet.",
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": (
            "Wallet loaded successfully."
        ),
        "wallet": (
            result["wallet_data"]
        ),
    }, 200


# ==========================
# Get Supported SA Banks
# ==========================
@wallet_bp.route(
    "/wallet/payout-banks",
    methods=["GET"],
)
@jwt_required()
def get_wallet_payout_banks():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    result = get_south_african_banks()

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                "Unable to load payout banks.",
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            "South African banks loaded successfully.",
        ),
        "banks": result.get(
            "banks",
            [],
        ),
        "count": result.get(
            "count",
            0,
        ),
    }, 200


# ==========================
# Get Payout Account
# ==========================
@wallet_bp.route(
    "/wallet/payout-account",
    methods=["GET"],
)
@jwt_required()
def get_wallet_payout_account():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    result = get_payout_account(
        artisan.id,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                "Unable to load payout account.",
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            "Payout account loaded successfully.",
        ),
        "payout_account": result.get(
            "payout_account_data",
        ),
    }, 200


# ==========================
# Validate Payout Account
# ==========================
@wallet_bp.route(
    "/wallet/payout-account/validate",
    methods=["POST"],
)
@jwt_required()
def validate_wallet_payout_account():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    data = request.get_json(
        silent=True,
    )

    if not data:
        return {
            "success": False,
            "message": (
                "Request body is required."
            ),
        }, 400

    account_name = str(
        data.get(
            "account_name",
            "",
        )
        or ""
    ).strip()

    account_number = str(
        data.get(
            "account_number",
            "",
        )
        or ""
    ).strip()

    account_type = str(
        data.get(
            "account_type",
            "",
        )
        or ""
    ).strip().lower()

    bank_code = str(
        data.get(
            "bank_code",
            "",
        )
        or ""
    ).strip()

    document_type = str(
        data.get(
            "document_type",
            "",
        )
        or ""
    ).strip()

    document_number = str(
        data.get(
            "document_number",
            "",
        )
        or ""
    ).strip()

    result = (
        validate_south_african_bank_account(
            account_name=account_name,
            account_number=account_number,
            account_type=account_type,
            bank_code=bank_code,
            document_type=document_type,
            document_number=(
                document_number
                or None
            ),
        )
    )

    if not result.get("success"):
        response = {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to validate payout "
                    "account."
                ),
            ),
        }

        if result.get("validation"):
            response["validation"] = (
                result["validation"]
            )

        return response, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            (
                "Payout account validated "
                "successfully."
            ),
        ),
        "validation": result.get(
            "validation",
        ),
    }, 200


# ==========================
# Create / Update Payout Account
# ==========================
@wallet_bp.route(
    "/wallet/payout-account",
    methods=["PUT"],
)
@jwt_required()
def update_wallet_payout_account():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    data = request.get_json(
        silent=True,
    )

    if not data:
        return {
            "success": False,
            "message": (
                "Request body is required."
            ),
        }, 400

    bank_name = str(
        data.get(
            "bank_name",
            "",
        )
        or ""
    ).strip()

    bank_code = str(
        data.get(
            "bank_code",
            "",
        )
        or ""
    ).strip()

    account_number = str(
        data.get(
            "account_number",
            "",
        )
        or ""
    ).strip()

    account_name = str(
        data.get(
            "account_name",
            "",
        )
        or ""
    ).strip()

    account_type = str(
        data.get(
            "account_type",
            "",
        )
        or ""
    ).strip().lower()

    document_type = str(
        data.get(
            "document_type",
            "",
        )
        or ""
    ).strip()

    document_number = str(
        data.get(
            "document_number",
            "",
        )
        or ""
    ).strip()

    currency = str(
        data.get(
            "currency",
            "ZAR",
        )
        or "ZAR"
    ).strip().upper()

    if not bank_name:
        return {
            "success": False,
            "message": (
                "Bank name is required."
            ),
        }, 400

    if not bank_code:
        return {
            "success": False,
            "message": (
                "Bank code is required."
            ),
        }, 400

    if not account_number:
        return {
            "success": False,
            "message": (
                "Account number is required."
            ),
        }, 400

    if not account_name:
        return {
            "success": False,
            "message": (
                "Account holder name is required."
            ),
        }, 400

    if not account_type:
        return {
            "success": False,
            "message": (
                "Account type is required."
            ),
        }, 400

    if not document_type:
        return {
            "success": False,
            "message": (
                "Document type is required."
            ),
        }, 400

    result = save_payout_account(
        artisan_id=artisan.id,
        bank_name=bank_name,
        bank_code=bank_code,
        account_number=account_number,
        account_name=account_name,
        account_type=account_type,
        document_type=document_type,
        document_number=(
            document_number
            or None
        ),
        currency=currency,
        recipient_type="basa",
    )

    if not result.get("success"):
        response = {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to save payout "
                    "account."
                ),
            ),
        }

        if result.get("validation"):
            response["validation"] = (
                result["validation"]
            )

        return response, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            (
                "Payout account saved "
                "successfully."
            ),
        ),
        "payout_account": result.get(
            "payout_account_data",
        ),
        "validation": result.get(
            "validation",
        ),
    }, (
        201
        if result.get("created")
        else 200
    )


# ==========================
# Get Wallet Transactions
# ==========================
@wallet_bp.route(
    "/wallet/transactions",
    methods=["GET"],
)
@jwt_required()
def get_wallet_transactions():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    page, page_error = (
        parse_positive_integer(
            request.args.get(
                "page",
            ),
            "Page",
            1,
        )
    )

    if page_error:
        return page_error, 400

    per_page, per_page_error = (
        parse_positive_integer(
            request.args.get(
                "per_page",
            ),
            "Per-page",
            20,
        )
    )

    if per_page_error:
        return (
            per_page_error,
            400,
        )

    per_page = min(
        per_page,
        100,
    )

    transaction_type = (
        request.args.get(
            "type",
            "",
        )
        .strip()
        .lower()
    )

    status = (
        request.args.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    query = Transaction.query.filter_by(
        artisan_id=artisan.id,
    )

    if transaction_type:
        query = query.filter(
            Transaction.transaction_type
            == transaction_type,
        )

    if status:
        query = query.filter(
            Transaction.status
            == status,
        )

    query = query.order_by(
        Transaction.created_at.desc(),
        Transaction.id.desc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return {
        "success": True,
        "message": (
            "Wallet transactions loaded "
            "successfully."
        ),
        "transactions": [
            transaction_to_dict(
                transaction,
            )
            for transaction
            in pagination.items
        ],
        "filters": {
            "type": transaction_type,
            "status": status,
        },
        "pagination": {
            "page": pagination.page,
            "per_page": (
                pagination.per_page
            ),
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": (
                pagination.has_next
            ),
            "has_previous": (
                pagination.has_prev
            ),
            "next_page": (
                pagination.next_num
                if pagination.has_next
                else None
            ),
            "previous_page": (
                pagination.prev_num
                if pagination.has_prev
                else None
            ),
        },
    }, 200


# ==========================
# Get Wallet Withdrawals
# ==========================
@wallet_bp.route(
    "/wallet/withdrawals",
    methods=["GET"],
)
@jwt_required()
def get_wallet_withdrawals():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    page, page_error = (
        parse_positive_integer(
            request.args.get(
                "page",
            ),
            "Page",
            1,
        )
    )

    if page_error:
        return page_error, 400

    per_page, per_page_error = (
        parse_positive_integer(
            request.args.get(
                "per_page",
            ),
            "Per-page",
            20,
        )
    )

    if per_page_error:
        return (
            per_page_error,
            400,
        )

    per_page = min(
        per_page,
        100,
    )

    status = (
        request.args.get(
            "status",
            "",
        )
        .strip()
        .lower()
    )

    query = Withdrawal.query.filter_by(
        artisan_id=artisan.id,
    )

    if status:
        query = query.filter(
            Withdrawal.status
            == status,
        )

    query = query.order_by(
        Withdrawal.requested_at.desc(),
        Withdrawal.id.desc(),
    )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return {
        "success": True,
        "message": (
            "Withdrawals loaded successfully."
        ),
        "withdrawals": [
            withdrawal_to_dict(
                withdrawal,
            )
            for withdrawal
            in pagination.items
        ],
        "filters": {
            "status": status,
        },
        "pagination": {
            "page": pagination.page,
            "per_page": (
                pagination.per_page
            ),
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": (
                pagination.has_next
            ),
            "has_previous": (
                pagination.has_prev
            ),
            "next_page": (
                pagination.next_num
                if pagination.has_next
                else None
            ),
            "previous_page": (
                pagination.prev_num
                if pagination.has_prev
                else None
            ),
        },
    }, 200


# ==========================
# Create Withdrawal Request
# ==========================
@wallet_bp.route(
    "/wallet/withdrawals",
    methods=["POST"],
)
@jwt_required()
def create_wallet_withdrawal():
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    data = request.get_json(
        silent=True,
    )

    if not data:
        return {
            "success": False,
            "message": (
                "Request body is required."
            ),
        }, 400

    amount = data.get(
        "amount",
    )

    result = create_withdrawal_request(
        artisan_id=artisan.id,
        amount=amount,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                "Unable to create withdrawal.",
            ),
        }, result.get(
            "status_code",
            400,
        )

    return {
        "success": True,
        "message": result.get(
            "message",
            "Withdrawal request created.",
        ),
        "withdrawal": (
            result["withdrawal_data"]
        ),
        "transaction": (
            result["transaction_data"]
        ),
        "wallet": (
            result["wallet_data"]
        ),
    }, 201


# ==========================
# Get One Withdrawal
# ==========================
@wallet_bp.route(
    "/wallet/withdrawals/<int:withdrawal_id>",
    methods=["GET"],
)
@jwt_required()
def get_wallet_withdrawal(
    withdrawal_id,
):
    artisan, error_response, status_code = (
        get_current_artisan()
    )

    if error_response:
        return (
            error_response,
            status_code,
        )

    withdrawal = db.session.get(
        Withdrawal,
        withdrawal_id,
    )

    if not withdrawal:
        return {
            "success": False,
            "message": (
                "Withdrawal not found."
            ),
        }, 404

    if (
        withdrawal.artisan_id
        != artisan.id
    ):
        return {
            "success": False,
            "message": (
                "You are not authorized to "
                "view this withdrawal."
            ),
        }, 403

    transaction = (
        Transaction.query.filter_by(
            withdrawal_id=withdrawal.id,
            transaction_type="withdrawal",
        )
        .order_by(
            Transaction.created_at.desc(),
        )
        .first()
    )

    return {
        "success": True,
        "message": (
            "Withdrawal loaded successfully."
        ),
        "withdrawal": (
            withdrawal_to_dict(
                withdrawal,
            )
        ),
        "transaction": (
            transaction_to_dict(
                transaction,
            )
            if transaction
            else None
        ),
    }, 200