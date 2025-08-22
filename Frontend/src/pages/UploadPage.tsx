import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoringApi } from '../services/api';
import { ScoringRequest } from '../types';
import './UploadPage.css';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ScoringRequest>({
    resume: null as any,
    jd: undefined,
    jd_text: '',
    metadata: {
      candidate_name: '',
      candidate_email: '',
      job_title: '',
      target_seniority: 'mid-level'
    }
  });
  
  const [jdInputType, setJdInputType] = useState<'text' | 'file'>('text');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'resume' | 'jd') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const field = name.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata!,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resume) {
      setError('Please select a resume file');
      return;
    }
    
    if (!formData.jd && !formData.jd_text) {
      setError('Please provide either a job description file or text');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // console.log("1",formData.resume);
      const response = await scoringApi.submitResume(formData);
      // console.log("r",response);
      
      if (response.status === 'pending') {
        // Redirect to results page
        navigate(`/results/${response.request_id}`);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit resume');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, field: 'resume' | 'jd') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };
  
  return (
    <div className="upload-page">
      <div className="upload-container">
        <h2>Resume ATS Scoring</h2>
        <p className="subtitle">
          Upload your resume and job description to get an ATS compatibility score
        </p>
        
        <form onSubmit={handleSubmit} className="upload-form">
          {/* Resume Upload */}
          <div className="form-section">
            <h3>Resume Upload *</h3>
            <div 
              className="file-drop-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'resume')}
            >
              <input
                type="file"
                id="resume"
                name="resume"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => handleFileChange(e, 'resume')}
                className="file-input"
                required
              />
              <label htmlFor="resume" className="file-label">
                {formData.resume ? (
                  <span className="file-name">{formData.resume.name}</span>
                ) : (
                  <>
                    <span className="drop-text">Drop your resume here or click to browse</span>
                    <span className="file-types">PDF, DOCX, DOC, TXT (max 5MB)</span>
                  </>
                )}
              </label>
            </div>
          </div>
          
          {/* Job Description */}
          <div className="form-section">
            <h3>Job Description *</h3>
            
            <div className="jd-input-toggle">
              <button
                type="button"
                className={`toggle-btn ${jdInputType === 'text' ? 'active' : ''}`}
                onClick={() => setJdInputType('text')}
              >
                Paste Text
              </button>
              <button
                type="button"
                className={`toggle-btn ${jdInputType === 'file' ? 'active' : ''}`}
                onClick={() => setJdInputType('file')}
              >
                Upload File
              </button>
            </div>
            
            {jdInputType === 'text' ? (
              <textarea
                name="jd_text"
                value={formData.jd_text}
                onChange={handleInputChange}
                placeholder="Paste the job description here..."
                className="jd-textarea"
                rows={8}
                required
              />
            ) : (
              <div 
                className="file-drop-zone"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'jd')}
              >
                <input
                  type="file"
                  id="jd"
                  name="jd"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => handleFileChange(e, 'jd')}
                  className="file-input"
                />
                <label htmlFor="jd" className="file-label">
                  {formData.jd ? (
                    <span className="file-name">{formData.jd.name}</span>
                  ) : (
                    <>
                      <span className="drop-text">Drop JD file here or click to browse</span>
                      <span className="file-types">PDF, DOCX, DOC, TXT (max 5MB)</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
          
          {/* Optional Metadata */}
          <div className="form-section">
            <h3>Additional Information (Optional)</h3>
            <div className="metadata-grid">
              <div className="form-group">
                <label htmlFor="candidate_name">Your Name</label>
                <input
                  type="text"
                  id="candidate_name"
                  name="metadata.candidate_name"
                  value={formData.metadata?.candidate_name || ''}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="candidate_email">Email</label>
                <input
                  type="email"
                  id="candidate_email"
                  name="metadata.candidate_email"
                  value={formData.metadata?.candidate_email || ''}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="job_title">Target Job Title</label>
                <input
                  type="text"
                  id="job_title"
                  name="metadata.job_title"
                  value={formData.metadata?.job_title || ''}
                  onChange={handleInputChange}
                  placeholder="Senior Software Engineer"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="target_seniority">Target Seniority</label>
                <select
                  id="target_seniority"
                  name="metadata.target_seniority"
                  value={formData.metadata?.target_seniority || 'mid-level'}
                  onChange={handleInputChange}
                >
                  <option value="entry-level">Entry Level</option>
                  <option value="mid-level">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="principal">Principal</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Score Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
