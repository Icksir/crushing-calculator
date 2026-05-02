import hashlib
import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func as sa_func
from typing import List, Optional

from src.db.database import get_db
from src.models.sql_models import SuggestionModel, SuggestionVoteModel
from src.models.schemas import SuggestionCreate, SuggestionResponse, VoteCreate
from src.settings.config import env_settings

router = APIRouter(tags=['suggestions'])

MAX_SUGGESTIONS_PER_DAY = 2
MIN_LENGTH = 10
MAX_LENGTH = 500
URL_PATTERN = re.compile(r'https?://|www\.', re.IGNORECASE)


def get_ip_hash(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return hashlib.sha256(ip.encode()).hexdigest()


@router.post("/suggestions", response_model=dict)
async def create_suggestion(
    data: SuggestionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    if data.website:
        return {"status": "ok"}

    text = data.text.strip()

    if len(text) < MIN_LENGTH:
        raise HTTPException(status_code=400, detail="suggestion_too_short")
    if len(text) > MAX_LENGTH:
        raise HTTPException(status_code=400, detail="suggestion_too_long")

    if URL_PATTERN.search(text):
        raise HTTPException(status_code=400, detail="suggestion_contains_url")

    ip_hash = get_ip_hash(request)

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(sa_func.count(SuggestionModel.id)).where(
            SuggestionModel.ip_hash == ip_hash,
            SuggestionModel.created_at >= since
        )
    )
    count = result.scalar()
    if count and count >= MAX_SUGGESTIONS_PER_DAY:
        raise HTTPException(status_code=429, detail="suggestion_limit_reached")

    suggestion = SuggestionModel(text=text, ip_hash=ip_hash)
    db.add(suggestion)
    await db.commit()

    return {"status": "ok"}


@router.get("/suggestions", response_model=List[SuggestionResponse])
async def list_suggestions(
    limit: int = 50,
    offset: int = 0,
    sort: str = "newest",
    status: Optional[str] = None,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    ip_hash = get_ip_hash(request) if request else ""

    order_clause = (
        (SuggestionModel.likes - SuggestionModel.dislikes).desc()
        if sort == "top"
        else SuggestionModel.created_at.desc()
    )

    query = select(SuggestionModel).order_by(order_clause)
    if status in ("open", "completed"):
        query = query.where(SuggestionModel.status == status)

    result = await db.execute(query.limit(limit).offset(offset))
    items = result.scalars().all()

    # Fetch user's votes for these suggestions
    suggestion_ids = [item.id for item in items]
    user_votes = {}
    if ip_hash and suggestion_ids:
        vote_result = await db.execute(
            select(SuggestionVoteModel).where(
                SuggestionVoteModel.suggestion_id.in_(suggestion_ids),
                SuggestionVoteModel.ip_hash == ip_hash
            )
        )
        for vote in vote_result.scalars().all():
            user_votes[vote.suggestion_id] = vote.vote_type

    return [
        SuggestionResponse(
            id=item.id,
            text=item.text,
            created_at=item.created_at,
            likes=item.likes,
            dislikes=item.dislikes,
            status=item.status,
            user_vote=user_votes.get(item.id)
        )
        for item in items
    ]


@router.post("/suggestions/{suggestion_id}/vote", response_model=dict)
async def vote_suggestion(
    suggestion_id: int,
    data: VoteCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    if data.vote not in (1, -1):
        raise HTTPException(status_code=400, detail="invalid_vote")

    ip_hash = get_ip_hash(request)

    # Check if suggestion exists
    result = await db.execute(
        select(SuggestionModel).where(SuggestionModel.id == suggestion_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="not_found")

    # Check existing vote
    result = await db.execute(
        select(SuggestionVoteModel).where(
            SuggestionVoteModel.suggestion_id == suggestion_id,
            SuggestionVoteModel.ip_hash == ip_hash
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.vote_type == data.vote:
            # Same vote -> remove it (toggle off)
            await db.delete(existing)
            if data.vote == 1:
                suggestion.likes = max(0, suggestion.likes - 1)
            else:
                suggestion.dislikes = max(0, suggestion.dislikes - 1)
        else:
            # Different vote -> change it
            old_vote = existing.vote_type
            existing.vote_type = data.vote
            if old_vote == 1:
                suggestion.likes = max(0, suggestion.likes - 1)
                suggestion.dislikes += 1
            else:
                suggestion.dislikes = max(0, suggestion.dislikes - 1)
                suggestion.likes += 1
    else:
        # New vote
        vote = SuggestionVoteModel(
            suggestion_id=suggestion_id,
            ip_hash=ip_hash,
            vote_type=data.vote
        )
        db.add(vote)
        if data.vote == 1:
            suggestion.likes += 1
        else:
            suggestion.dislikes += 1

    await db.commit()

    return {
        "status": "ok",
        "likes": suggestion.likes,
        "dislikes": suggestion.dislikes,
        "user_vote": data.vote if not existing or existing.vote_type != data.vote else None
    }


@router.patch("/suggestions/{suggestion_id}/complete", response_model=dict)
async def complete_suggestion(
    suggestion_id: int,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: AsyncSession = Depends(get_db)
):
    if not env_settings.suggestions_admin_key or x_admin_key != env_settings.suggestions_admin_key:
        raise HTTPException(status_code=403, detail="forbidden")

    result = await db.execute(
        select(SuggestionModel).where(SuggestionModel.id == suggestion_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="not_found")

    suggestion.status = "completed"
    await db.commit()

    return {"status": "ok"}


@router.patch("/suggestions/{suggestion_id}/reopen", response_model=dict)
async def reopen_suggestion(
    suggestion_id: int,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: AsyncSession = Depends(get_db)
):
    if not env_settings.suggestions_admin_key or x_admin_key != env_settings.suggestions_admin_key:
        raise HTTPException(status_code=403, detail="forbidden")

    result = await db.execute(
        select(SuggestionModel).where(SuggestionModel.id == suggestion_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="not_found")

    suggestion.status = "open"
    await db.commit()

    return {"status": "ok"}


@router.delete("/suggestions/{suggestion_id}", response_model=dict)
async def delete_suggestion(
    suggestion_id: int,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: AsyncSession = Depends(get_db)
):
    if not env_settings.suggestions_admin_key or x_admin_key != env_settings.suggestions_admin_key:
        raise HTTPException(status_code=403, detail="forbidden")

    result = await db.execute(
        select(SuggestionModel).where(SuggestionModel.id == suggestion_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="not_found")

    await db.execute(
        select(SuggestionVoteModel).where(SuggestionVoteModel.suggestion_id == suggestion_id)
    )

    await db.delete(suggestion)
    await db.commit()

    return {"status": "ok"}
