# server/services/payout_account_service.py

from database import db
from models.payout_account import PayoutAccount
from models.user import User
from services.payment_service import paystack_request


ALLOWED_ACCOUNT_TYPES = {
    "personal",
    "business",
}

ALLOWED_DOCUMENT_TYPES = {
    "identityNumber",
    "passportNumber",
    "businessRegistrationNumber",
}

SOUTH_AFRICA_COUNTRY_CODE = "ZA"
SOUTH_AFRICA_CURRENCY = "ZAR"
SOUTH_AFRICA_RECIPIENT_TYPE = "basa"


# ==========================================
# Helpers
# ==========================================
def normalize_text(value):
    if value is None:
        return ""

    return str(value).strip()


def normalize_bank_code(value):
    return normalize_text(value)


def normalize_account_number(value):
    return (
        normalize_text(value)
        .replace(" ", "")
        .replace("-", "")
    )


def payout_account_to_dict(payout_account):
    if not payout_account:
        return None

    return payout_account.to_dict()


def get_artisan(artisan_id):
    artisan = db.session.get(
        User,
        artisan_id,
    )

    if not artisan:
        return None, {
            "success": False,
            "message": "Artisan not found.",
            "status_code": 404,
        }

    if artisan.role != "artisan":
        return None, {
            "success": False,
            "message": (
                "Only artisans can configure "
                "payout accounts."
            ),
            "status_code": 403,
        }

    if artisan.status != "active":
        return None, {
            "success": False,
            "message": (
                "Only active artisan accounts "
                "can configure payout accounts."
            ),
            "status_code": 403,
        }

    return artisan, None


def build_safe_validation_data(
    provider_data,
    account_name,
    account_number,
    bank_code,
    account_type,
):
    provider_data = (
        provider_data
        if isinstance(provider_data, dict)
        else {}
    )

    return {
        "account_name": account_name,
        "account_number": account_number,
        "bank_code": bank_code,
        "account_type": account_type,
        "country_code": SOUTH_AFRICA_COUNTRY_CODE,
        "currency": SOUTH_AFRICA_CURRENCY,
        "verified": bool(
            provider_data.get(
                "verified",
                False,
            )
        ),
        "account_holder_match": bool(
            provider_data.get(
                "accountHolderMatch",
                False,
            )
        ),
        "account_accepts_credits": bool(
            provider_data.get(
                "accountAcceptsCredits",
                False,
            )
        ),
        "account_open": bool(
            provider_data.get(
                "accountOpen",
                False,
            )
        ),
        "account_open_for_more_than_three_months": bool(
            provider_data.get(
                "accountOpenForMoreThanThreeMonths",
                False,
            )
        ),
        "verification_message": normalize_text(
            provider_data.get(
                "verificationMessage",
            )
        ),
    }


# ==========================================
# Get Payout Account
# ==========================================
def get_payout_account(
    artisan_id,
):
    artisan, error = get_artisan(
        artisan_id,
    )

    if error:
        return error

    payout_account = (
        PayoutAccount.query.filter_by(
            artisan_id=artisan.id,
        )
        .first()
    )

    return {
        "success": True,
        "message": (
            "Payout account loaded "
            "successfully."
        ),
        "payout_account": payout_account,
        "payout_account_data": (
            payout_account_to_dict(
                payout_account,
            )
        ),
    }


# ==========================================
# Get South African Banks
# ==========================================
def get_south_african_banks():
    result = paystack_request(
        method="GET",
        endpoint=(
            "/bank"
            "?currency=ZAR"
            "&enabled_for_verification=true"
        ),
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to load supported "
                    "South African banks."
                ),
            ),
            "status_code": result.get(
                "status_code",
                400,
            ),
        }

    provider_banks = result.get(
        "data",
        [],
    )

    banks = []

    for bank in provider_banks:
        if not isinstance(bank, dict):
            continue

        code = normalize_bank_code(
            bank.get(
                "code",
            )
        )

        name = normalize_text(
            bank.get(
                "name",
            )
        )

        if not code or not name:
            continue

        supported_types = (
            bank.get(
                "supported_types",
                [],
            )
            or []
        )

        banks.append(
            {
                "id": bank.get(
                    "id",
                ),
                "name": name,
                "code": code,
                "slug": bank.get(
                    "slug",
                ),
                "country": bank.get(
                    "country",
                ),
                "currency": (
                    bank.get(
                        "currency",
                        SOUTH_AFRICA_CURRENCY,
                    )
                    or SOUTH_AFRICA_CURRENCY
                ),
                "type": (
                    bank.get(
                        "type",
                        SOUTH_AFRICA_RECIPIENT_TYPE,
                    )
                    or SOUTH_AFRICA_RECIPIENT_TYPE
                ),
                "active": bool(
                    bank.get(
                        "active",
                        True,
                    )
                ),
                "supported_types": (
                    supported_types
                ),
            }
        )

    banks.sort(
        key=lambda bank: (
            bank["name"].lower()
        )
    )

    return {
        "success": True,
        "message": (
            "South African banks loaded "
            "successfully."
        ),
        "banks": banks,
        "count": len(banks),
    }


# ==========================================
# Validate South African Bank Account
# ==========================================
def validate_south_african_bank_account(
    account_name,
    account_number,
    account_type,
    bank_code,
    document_type,
    document_number=None,
):
    account_name = normalize_text(
        account_name,
    )

    account_number = (
        normalize_account_number(
            account_number,
        )
    )

    account_type = (
        normalize_text(
            account_type,
        )
        .lower()
    )

    bank_code = normalize_bank_code(
        bank_code,
    )

    document_type = normalize_text(
        document_type,
    )

    document_number = normalize_text(
        document_number,
    )

    if not account_name:
        return {
            "success": False,
            "message": (
                "Account holder name is required."
            ),
            "status_code": 400,
        }

    if not account_number:
        return {
            "success": False,
            "message": (
                "Bank account number is required."
            ),
            "status_code": 400,
        }

    if not account_number.isdigit():
        return {
            "success": False,
            "message": (
                "Bank account number must contain "
                "numbers only."
            ),
            "status_code": 400,
        }

    if account_type not in ALLOWED_ACCOUNT_TYPES:
        return {
            "success": False,
            "message": (
                "Account type must be either "
                "'personal' or 'business'."
            ),
            "status_code": 400,
        }

    if not bank_code:
        return {
            "success": False,
            "message": (
                "Bank code is required."
            ),
            "status_code": 400,
        }

    if document_type not in ALLOWED_DOCUMENT_TYPES:
        return {
            "success": False,
            "message": (
                "Document type must be one of: "
                "identityNumber, passportNumber, "
                "businessRegistrationNumber."
            ),
            "status_code": 400,
        }

    if (
        account_type == "business"
        and document_type != "businessRegistrationNumber"
    ):
        return {
            "success": False,
            "message": (
                "Business payout accounts must use "
                "businessRegistrationNumber as the "
                "document type."
            ),
            "status_code": 400,
        }

    payload = {
        "account_name": account_name,
        "account_number": account_number,
        "account_type": account_type,
        "bank_code": bank_code,
        "country_code": SOUTH_AFRICA_COUNTRY_CODE,
        "document_type": document_type,
    }

    if document_number:
        payload["document_number"] = (
            document_number
        )

    result = paystack_request(
        method="POST",
        endpoint="/bank/validate",
        json_data=payload,
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to validate the "
                    "South African bank account."
                ),
            ),
            "status_code": result.get(
                "status_code",
                400,
            ),
        }

    provider_data = result.get(
        "data",
        {},
    )

    if not isinstance(
        provider_data,
        dict,
    ):
        provider_data = {}

    safe_data = build_safe_validation_data(
        provider_data=provider_data,
        account_name=account_name,
        account_number=account_number,
        bank_code=bank_code,
        account_type=account_type,
    )

    if not safe_data["verified"]:
        return {
            "success": False,
            "message": (
                safe_data[
                    "verification_message"
                ]
                or (
                    "Paystack could not verify "
                    "this bank account."
                )
            ),
            "status_code": 409,
            "validation": safe_data,
        }

    if not safe_data[
        "account_holder_match"
    ]:
        return {
            "success": False,
            "message": (
                "The account holder name does not "
                "match the bank account."
            ),
            "status_code": 409,
            "validation": safe_data,
        }

    if not safe_data[
        "account_accepts_credits"
    ]:
        return {
            "success": False,
            "message": (
                "This bank account cannot currently "
                "receive credits."
            ),
            "status_code": 409,
            "validation": safe_data,
        }

    if not safe_data[
        "account_open"
    ]:
        return {
            "success": False,
            "message": (
                "This bank account is not open."
            ),
            "status_code": 409,
            "validation": safe_data,
        }

    return {
        "success": True,
        "message": (
            "South African bank account "
            "validated successfully."
        ),
        "account_name": account_name,
        "account_number": account_number,
        "account_type": account_type,
        "bank_code": bank_code,
        "validation": safe_data,
        "provider_data": provider_data,
    }


# ==========================================
# Backwards-Compatible Resolver Name
# ==========================================
def resolve_bank_account(
    account_number,
    bank_code,
    account_name=None,
    account_type=None,
    document_type=None,
    document_number=None,
):
    """
    Compatibility wrapper.

    South African ZAR payout accounts require
    Paystack's POST /bank/validate flow rather
    than GET /bank/resolve.
    """

    if not all(
        [
            account_name,
            account_type,
            document_type,
        ]
    ):
        return {
            "success": False,
            "message": (
                "South African bank validation "
                "requires account_name, "
                "account_type and document_type."
            ),
            "status_code": 400,
        }

    return validate_south_african_bank_account(
        account_name=account_name,
        account_number=account_number,
        account_type=account_type,
        bank_code=bank_code,
        document_type=document_type,
        document_number=document_number,
    )


# ==========================================
# Create Paystack Transfer Recipient
# ==========================================
def create_transfer_recipient(
    account_name,
    account_number,
    bank_code,
    currency=SOUTH_AFRICA_CURRENCY,
    recipient_type=SOUTH_AFRICA_RECIPIENT_TYPE,
):
    account_name = normalize_text(
        account_name,
    )

    account_number = (
        normalize_account_number(
            account_number,
        )
    )

    bank_code = normalize_bank_code(
        bank_code,
    )

    currency = (
        normalize_text(currency)
        or SOUTH_AFRICA_CURRENCY
    ).upper()

    recipient_type = (
        normalize_text(
            recipient_type,
        )
        or SOUTH_AFRICA_RECIPIENT_TYPE
    ).lower()

    if not account_name:
        return {
            "success": False,
            "message": (
                "Account name is required."
            ),
            "status_code": 400,
        }

    if not account_number:
        return {
            "success": False,
            "message": (
                "Account number is required."
            ),
            "status_code": 400,
        }

    if not bank_code:
        return {
            "success": False,
            "message": (
                "Bank code is required."
            ),
            "status_code": 400,
        }

    if currency != SOUTH_AFRICA_CURRENCY:
        return {
            "success": False,
            "message": (
                "ServiceFlow payout accounts "
                "currently support ZAR only."
            ),
            "status_code": 400,
        }

    if (
        recipient_type
        != SOUTH_AFRICA_RECIPIENT_TYPE
    ):
        return {
            "success": False,
            "message": (
                "South African payout recipients "
                "must use recipient type 'basa'."
            ),
            "status_code": 400,
        }

    result = paystack_request(
        method="POST",
        endpoint="/transferrecipient",
        json_data={
            "type": (
                SOUTH_AFRICA_RECIPIENT_TYPE
            ),
            "name": account_name,
            "account_number": (
                account_number
            ),
            "bank_code": bank_code,
            "currency": (
                SOUTH_AFRICA_CURRENCY
            ),
        },
    )

    if not result.get("success"):
        return {
            "success": False,
            "message": result.get(
                "message",
                (
                    "Unable to create the "
                    "Paystack transfer "
                    "recipient."
                ),
            ),
            "status_code": result.get(
                "status_code",
                400,
            ),
        }

    data = result.get(
        "data",
        {},
    )

    recipient_code = normalize_text(
        data.get(
            "recipient_code",
        )
    )

    if not recipient_code:
        return {
            "success": False,
            "message": (
                "Paystack did not return a "
                "transfer recipient code."
            ),
            "status_code": 502,
        }

    return {
        "success": True,
        "message": (
            "Transfer recipient created "
            "successfully."
        ),
        "recipient_code": recipient_code,
        "provider_data": data,
    }


# ==========================================
# Create / Update Payout Account
# ==========================================
def save_payout_account(
    artisan_id,
    bank_name,
    bank_code,
    account_number,
    account_name,
    account_type,
    document_type,
    document_number=None,
    currency=SOUTH_AFRICA_CURRENCY,
    recipient_type=SOUTH_AFRICA_RECIPIENT_TYPE,
    commit=True,
):
    artisan, error = get_artisan(
        artisan_id,
    )

    if error:
        return error

    bank_name = normalize_text(
        bank_name,
    )

    bank_code = normalize_bank_code(
        bank_code,
    )

    account_number = (
        normalize_account_number(
            account_number,
        )
    )

    account_name = normalize_text(
        account_name,
    )

    account_type = (
        normalize_text(
            account_type,
        )
        .lower()
    )

    document_type = normalize_text(
        document_type,
    )

    document_number = normalize_text(
        document_number,
    )

    currency = (
        normalize_text(currency)
        or SOUTH_AFRICA_CURRENCY
    ).upper()

    recipient_type = (
        normalize_text(
            recipient_type,
        )
        or SOUTH_AFRICA_RECIPIENT_TYPE
    ).lower()

    if not bank_name:
        return {
            "success": False,
            "message": (
                "Bank name is required."
            ),
            "status_code": 400,
        }

    if not bank_code:
        return {
            "success": False,
            "message": (
                "Bank code is required."
            ),
            "status_code": 400,
        }

    if not account_number:
        return {
            "success": False,
            "message": (
                "Account number is required."
            ),
            "status_code": 400,
        }

    if currency != SOUTH_AFRICA_CURRENCY:
        return {
            "success": False,
            "message": (
                "ServiceFlow payout accounts "
                "currently support ZAR only."
            ),
            "status_code": 400,
        }

    if (
        recipient_type
        != SOUTH_AFRICA_RECIPIENT_TYPE
    ):
        return {
            "success": False,
            "message": (
                "South African payout recipients "
                "must use recipient type 'basa'."
            ),
            "status_code": 400,
        }

    # --------------------------------------
    # Validate account with Paystack
    # --------------------------------------
    validation_result = (
        validate_south_african_bank_account(
            account_name=account_name,
            account_number=account_number,
            account_type=account_type,
            bank_code=bank_code,
            document_type=document_type,
            document_number=document_number,
        )
    )

    if not validation_result.get(
        "success"
    ):
        return validation_result

    verified_account_number = (
        validation_result[
            "account_number"
        ]
    )

    verified_account_name = (
        validation_result[
            "account_name"
        ]
    )

    # --------------------------------------
    # Create transfer recipient
    # --------------------------------------
    recipient_result = (
        create_transfer_recipient(
            account_name=(
                verified_account_name
            ),
            account_number=(
                verified_account_number
            ),
            bank_code=bank_code,
            currency=currency,
            recipient_type=recipient_type,
        )
    )

    if not recipient_result.get(
        "success"
    ):
        return recipient_result

    recipient_code = (
        recipient_result[
            "recipient_code"
        ]
    )

    # --------------------------------------
    # Find existing account
    # --------------------------------------
    payout_account = (
        PayoutAccount.query.filter_by(
            artisan_id=artisan.id,
        )
        .first()
    )

    created = payout_account is None

    if created:
        payout_account = PayoutAccount(
            artisan_id=artisan.id,
        )

        db.session.add(
            payout_account,
        )

    payout_account.bank_name = bank_name
    payout_account.bank_code = bank_code
    payout_account.account_number = (
        verified_account_number
    )
    payout_account.account_name = (
        verified_account_name
    )
    payout_account.recipient_code = (
        recipient_code
    )
    payout_account.recipient_type = (
        SOUTH_AFRICA_RECIPIENT_TYPE
    )
    payout_account.currency = (
        SOUTH_AFRICA_CURRENCY
    )
    payout_account.is_verified = True
    payout_account.is_active = True

    try:
        if commit:
            db.session.commit()
        else:
            db.session.flush()

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "The bank account was "
                "validated, but ServiceFlow "
                "could not save the payout "
                "account."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Payout account created "
            "successfully."
            if created
            else
            "Payout account updated "
            "successfully."
        ),
        "created": created,
        "payout_account": (
            payout_account
        ),
        "payout_account_data": (
            payout_account_to_dict(
                payout_account,
            )
        ),
        "recipient_code": (
            recipient_code
        ),
        "validation": (
            validation_result.get(
                "validation",
            )
        ),
    }


# ==========================================
# Disable Payout Account
# ==========================================
def disable_payout_account(
    artisan_id,
    commit=True,
):
    artisan, error = get_artisan(
        artisan_id,
    )

    if error:
        return error

    payout_account = (
        PayoutAccount.query.filter_by(
            artisan_id=artisan.id,
        )
        .first()
    )

    if not payout_account:
        return {
            "success": False,
            "message": (
                "Payout account not found."
            ),
            "status_code": 404,
        }

    payout_account.is_active = False

    try:
        if commit:
            db.session.commit()
        else:
            db.session.flush()

    except Exception:
        db.session.rollback()

        return {
            "success": False,
            "message": (
                "Unable to disable the "
                "payout account."
            ),
            "status_code": 500,
        }

    return {
        "success": True,
        "message": (
            "Payout account disabled "
            "successfully."
        ),
        "payout_account": (
            payout_account
        ),
        "payout_account_data": (
            payout_account_to_dict(
                payout_account,
            )
        ),
    }