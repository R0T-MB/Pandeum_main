"""add provider rejection fields for verification resubmission flow

Revision ID: a1b2c3d4e5f6
Revises: 8e6c4cac7269
Create Date: 2026-08-05 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8e6c4cac7269'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('providers', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('providers', sa.Column('rejection_category', sa.String(), nullable=True))
    op.add_column('providers', sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('providers', 'rejected_at')
    op.drop_column('providers', 'rejection_category')
    op.drop_column('providers', 'rejection_reason')