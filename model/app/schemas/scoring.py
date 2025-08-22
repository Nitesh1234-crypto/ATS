from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScoringRequest(BaseModel):
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    target_seniority: Optional[str] = None

class ScoringResponse(BaseModel):
    request_id: str
    overall_score: int = Field(..., ge=0, le=100)
    scores: Dict[str, int] = Field(..., description="Sub-scores for different categories")
    matched_keywords: List[str]
    missing_keywords: List[Dict[str, str]]
    skills: Dict[str, List[str]]
    experience: Dict[str, Any]
    formatting_issues: List[str]
    suggestions: Dict[str, List[str]]
    explanations: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    raw_parsed_resume: str
    raw_parsed_jd: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ParsedResume(BaseModel):
    contact_info: Dict[str, Optional[str]]
    skills: List[str]
    experience: List[Dict[str, Any]]
    total_years_experience: float
    education: List[Dict[str, Any]]
    certifications: List[str]
    projects: List[str]
    summary: str
    raw_text: str

class ParsedJD(BaseModel):
    skills: List[str]
    required_years_experience: float
    role_keywords: List[str]
    required_technologies: List[str]
    seniority: str
    responsibilities: List[str]
    raw_text: str

class KeywordMatch(BaseModel):
    keyword: str
    importance: str
    matched: bool
    confidence: float
