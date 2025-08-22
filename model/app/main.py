from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.core.config import settings
from app.api.v1.router import api_router
from app.services.scoring_service import ScoringService

app = FastAPI(
    title="ATS Scoring ML Service",
    description="AI-powered resume scoring and analysis service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ats-ml-service"}

@app.get("/")
async def root():
    return {
        "message": "ATS Scoring ML Service",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True
    )
