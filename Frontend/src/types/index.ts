export interface ScoringRequest {
  resume: File;
  jd?: File;
  jd_text?: string;
  metadata?: {
    candidate_name?: string;
    candidate_email?: string;
    job_title?: string;
    target_seniority?: string;
  };
}

export interface ScoringResponse {
  request_id: string;
  overall_score: number;
  scores: {
    keyword_match: number;
    skills: number;
    experience: number;
    education: number;
    formatting: number;
  };
  matched_keywords: string[];
  missing_keywords: Array<{
    keyword: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
  }>;
  skills: {
    extracted: string[];
    missing_relevant: string[];
  };
  experience: {
    total_years: number;
    matches: Array<{
      req: string;
      candidate: string;
      ok: boolean;
    }>;
  };
  formatting_issues: string[];
  suggestions: {
    keyword_insertions: string[];
    resume_bullets_examples: string[];
    file_recommendation: string;
  };
  explanations: string;
  confidence: number;
  raw_parsed_resume: string;
  raw_parsed_jd: string;
  created_at: string;
}

export interface JobStatus {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  result?: ScoringResponse;
}
