"""Add admin and account management fields

Revision ID: 2677857a693f
Revises: bf56291e129a
Create Date: 2026-08-06 10:40:21.690549
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2677857a693f"
down_revision = "bf56291e129a"
branch_labels = None
depends_on = None


def upgrade():
    # ==========================
    # Add account management fields
    # ==========================
    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default="active",
            ),
        )

        batch_op.add_column(
            sa.Column(
                "email_verified",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

        batch_op.add_column(
            sa.Column(
                "verified",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

        batch_op.add_column(
            sa.Column(
                "is_pro",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.func.now(),
            ),
        )

        batch_op.alter_column(
            "role",
            existing_type=sa.VARCHAR(length=30),
            existing_nullable=True,
            nullable=False,
            server_default="customer",
        )

        # Keep the existing users_email_key unique constraint.
        # Only create supporting non-unique indexes here.
        batch_op.create_index(
            "ix_users_role",
            ["role"],
            unique=False,
        )

        batch_op.create_index(
            "ix_users_status",
            ["status"],
            unique=False,
        )

    # ==========================
    # Remove temporary defaults
    # ==========================
    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=20),
            server_default=None,
        )

        batch_op.alter_column(
            "email_verified",
            existing_type=sa.Boolean(),
            server_default=None,
        )

        batch_op.alter_column(
            "verified",
            existing_type=sa.Boolean(),
            server_default=None,
        )

        batch_op.alter_column(
            "is_pro",
            existing_type=sa.Boolean(),
            server_default=None,
        )

        batch_op.alter_column(
            "role",
            existing_type=sa.VARCHAR(length=30),
            server_default=None,
        )


def downgrade():
    # ==========================
    # Remove account management fields
    # ==========================
    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            "ix_users_status",
        )

        batch_op.drop_index(
            "ix_users_role",
        )

        batch_op.alter_column(
            "role",
            existing_type=sa.VARCHAR(length=30),
            existing_nullable=False,
            nullable=True,
        )

        batch_op.drop_column(
            "updated_at",
        )

        batch_op.drop_column(
            "is_pro",
        )

        batch_op.drop_column(
            "verified",
        )

        batch_op.drop_column(
            "email_verified",
        )

        batch_op.drop_column(
            "status",
        )