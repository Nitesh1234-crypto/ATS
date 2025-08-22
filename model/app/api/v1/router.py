from fastapi import APIRouter
from app.api.v1.endpoints.scoring import router as scoring_router

api_router = APIRouter()

# Include scoring endpoints
api_router.include_router(scoring_router, prefix="/scoring", tags=["scoring"])
