import asyncio
from typing import Dict, List, Any, Optional
from fastapi import UploadFile
import uuid
from app.schemas.scoring import ScoringResponse, ParsedResume, ParsedJD
from app.services.parser_service import ParserService
from app.services.embedding_service import EmbeddingService
from app.services.scoring_engine import ScoringEngine
from app.core.config import settings

class ScoringService:
    def __init__(self):
        self.parser_service = ParserService()
        self.embedding_service = EmbeddingService()
        self.scoring_engine = ScoringEngine()
    
    async def analyze_resume(
        self,
        request_id: str,
        resume_file: UploadFile,
        jd_file: Optional[UploadFile] = None,
        jd_text: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ScoringResponse:
        """
        Asynchronous resume analysis
        """
        try:
            # Parse resume
            parsed_resume = await self.parser_service.parse_resume(resume_file)
            
            # Parse JD
            if jd_file:
                parsed_jd = await self.parser_service.parse_jd_file(jd_file)
            else:
                parsed_jd = await self.parser_service.parse_jd_text(jd_text or "")
            
            # Generate embeddings
            resume_embeddings = await self.embedding_service.get_embeddings([parsed_resume.raw_text])
            jd_embeddings = await self.embedding_service.get_embeddings([parsed_jd.raw_text])
            
            # Score the resume
            scoring_result = await self.scoring_engine.score_resume(
                parsed_resume=parsed_resume,
                parsed_jd=parsed_jd,
                resume_embeddings=resume_embeddings,
                jd_embeddings=jd_embeddings
            )
            
            # Build response
            return ScoringResponse(
                request_id=request_id,
                overall_score=scoring_result["overall_score"],
                scores=scoring_result["scores"],
                matched_keywords=scoring_result["matched_keywords"],
                missing_keywords=scoring_result["missing_keywords"],
                skills=scoring_result["skills"],
                experience=scoring_result["experience"],
                formatting_issues=scoring_result["formatting_issues"],
                suggestions=scoring_result["suggestions"],
                explanations=scoring_result["explanations"],
                confidence=scoring_result["confidence"],
                raw_parsed_resume=parsed_resume.raw_text,
                raw_parsed_jd=parsed_jd.raw_text
            )
            
        except Exception as e:
            raise Exception(f"Error in resume analysis: {str(e)}")
    
    async def analyze_resume_sync(
        self,
        request_id: str,
        resume_file: UploadFile,
        jd_file: Optional[UploadFile] = None,
        jd_text: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ScoringResponse:
        """
        Synchronous resume analysis for small inputs
        """
        return await self.analyze_resume(
            request_id=request_id,
            resume_file=resume_file,
            jd_file=jd_file,
            jd_text=jd_text,
            metadata=metadata
        )
