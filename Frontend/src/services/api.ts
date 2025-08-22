import axios from 'axios';
import { ScoringRequest, ScoringResponse, JobStatus } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const scoringApi = {
  // Submit resume for scoring
  async submitResume(request: ScoringRequest): Promise<JobStatus> {
    const formData = new FormData();
    console.log("2",request);
    formData.append('resume', request.resume);
    console.log("2.1",formData);
    
    if (request.jd) {
      formData.append('jd', request.jd);
      console.log("2.2",formData);
    }
    
    if (request.jd_text) {
      formData.append('jd_text', request.jd_text);
      console.log("2.3",formData);
    }
    
    if (request.metadata?.candidate_name) {
      formData.append('candidate_name', request.metadata.candidate_name);
    }
    
    if (request.metadata?.candidate_email) {
      formData.append('candidate_email', request.metadata.candidate_email);
    }
    
    if (request.metadata?.job_title) {
      formData.append('job_title', request.metadata.job_title);
    }
    
    if (request.metadata?.target_seniority) {
      formData.append('target_seniority', request.metadata.target_seniority);
    }
    console.log("3", [...formData.entries()]);
    const response = await api.post('/api/v1/ats/score', formData);
    
    return response.data;
  },
  
  // Get scoring result
  async getResult(requestId: string): Promise<ScoringResponse> {
    const response = await api.get(`/api/v1/ats/score/${requestId}`);
    return response.data;
  },
  
  // Get job status
  async getStatus(requestId: string): Promise<JobStatus> {
    const response = await api.get(`/api/v1/ats/score/${requestId}`);
    return response.data;
  },
  
  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
