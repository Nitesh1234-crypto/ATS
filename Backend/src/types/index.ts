export interface ScoringRequest {
  resume: Express.Multer.File;
  jd?: Express.Multer.File;
  jd_text?: string;
  metadata?: {
    candidate_name?: string;
    candidate_email?: string;
    job_title?: string;
    target_seniority?: string;
  };
}

export interface ScoringJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request: ScoringRequest;
  result?: ScoringResult;
  created_at: Date;
  updated_at: Date;
  error?: string;
}

export interface ScoringResult {
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
}

export interface ParsedResume {
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    years: number;
    description: string;
  }>;
  total_years_experience: number;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: string[];
  projects: string[];
  summary: string;
  raw_text: string;
}

export interface ParsedJD {
  skills: string[];
  required_years_experience: number;
  role_keywords: string[];
  required_technologies: string[];
  seniority: string;
  responsibilities: string[];
  raw_text: string;
}
