from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.services.scoring_service import ScoringService
from app.schemas.scoring import ScoringRequest, ScoringResponse
import uuid

router = APIRouter()
scoring_service = ScoringService()

@router.post("/analyze", response_model=ScoringResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    candidate_name: Optional[str] = Form(None),
    candidate_email: Optional[str] = Form(None),
    job_title: Optional[str] = Form(None),
    target_seniority: Optional[str] = Form(None)
):
   
    try:
        # Validate inputs
        if not jd_file and not jd_text:
            raise HTTPException(
                status_code=400, 
                detail="Either JD file or JD text is required"
            )
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        
        # Process the analysis
        result = await scoring_service.analyze_resume(
            request_id=request_id,
            resume_file=resume,
            jd_file=jd_file,
            jd_text=jd_text,
            metadata={
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                "job_title": job_title,
                "target_seniority": target_seniority
            }
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-sync", response_model=ScoringResponse)
async def analyze_resume_sync(
    resume: UploadFile = File(...),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    candidate_name: Optional[str] = Form(None),
    candidate_email: Optional[str] = Form(None),
    job_title: Optional[str] = Form(None),
    target_seniority: Optional[str] = Form(None)
):
    try:
        # Validate inputs
        if not jd_file and not jd_text:
            raise HTTPException(
                status_code=400, 
                detail="Either JD file or JD text is required"
            )
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        
        # Process the analysis synchronously
        result = await scoring_service.analyze_resume_sync(
            request_id=request_id,
            resume_file=resume,
            jd_file=jd_file,
            jd_text=jd_text,
            metadata={
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                "job_title": job_title,
                "target_seniority": target_seniority
            }
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "scoring"}
