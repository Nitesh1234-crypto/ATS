import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scoringApi } from '../services/api';
import { ScoringResponse, JobStatus } from '../types';
import './ResultsPage.css';

const ResultsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const [result, setResult] = useState<ScoringResponse | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (requestId) {
      pollForResults();
    }
  }, [requestId]);
  
  const pollForResults = async () => {
    try {
      const response = await scoringApi.getStatus(requestId!);
      setStatus(response);
      
      if (response.status === 'completed') {
        // const scoringResult = await scoringApi.getResult(requestId!);
        setResult(response.result || null);
        setIsLoading(false);
      } else if (response.status === 'failed') {
        setError('Job processing failed');
        setIsLoading(false);
      } else {
        // Still processing, poll again in 2 seconds
        setTimeout(pollForResults, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch results');
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <h2>Processing Your Resume</h2>
          <div className="loading-spinner"></div>
          <p>This may take a few moments...</p>
          {status && (
            <div className="status-info">
              <p>Status: {status.status}</p>
              {status.message && <p>{status.message}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (error || !result) {
    return (
      <div className="results-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Failed to load results'}</p>
          <Link to="/" className="back-btn">Try Again</Link>
        </div>
      </div>
    );
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };
  
  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <h2>ATS Scoring Results</h2>
          <Link to="/" className="new-analysis-btn">New Analysis</Link>
        </div>
        
        {/* Overall Score */}
        <div className="overall-score-section">
          <div className={`score-badge ${getScoreColor(result.overall_score)}`}>
            <div className="score-number">{result.overall_score}</div>
            <div className="score-label">{getScoreLabel(result.overall_score)}</div>
          </div>
          <div className="score-explanation">
            <h3>Overall Score</h3>
            <p>{result.explanations}</p>
            <div className="confidence">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="score-breakdown">
          <h3>Score Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <div className="breakdown-label">Keyword Match</div>
              <div className={`breakdown-score ${getScoreColor(result.scores.keyword_match)}`}>
                {result.scores.keyword_match}
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">Skills</div>
              <div className={`breakdown-score ${getScoreColor(result.scores.skills)}`}>
                {result.scores.skills}
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">Experience</div>
              <div className={`breakdown-score ${getScoreColor(result.scores.experience)}`}>
                {result.scores.experience}
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">Education</div>
              <div className={`breakdown-score ${getScoreColor(result.scores.education)}`}>
                {result.scores.education}
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">Formatting</div>
              <div className={`breakdown-score ${getScoreColor(result.scores.formatting)}`}>
                {result.scores.formatting}
              </div>
            </div>
          </div>
        </div>
        
        {/* Keywords Analysis */}
        <div className="keywords-section">
          <div className="keywords-grid">
            <div className="keywords-column">
              <h3>Matched Keywords</h3>
              <div className="keywords-list">
                {result.matched_keywords.map((keyword, index) => (
                  <span key={index} className="keyword matched">{keyword}</span>
                ))}
              </div>
            </div>
            
            <div className="keywords-column">
              <h3>Missing Keywords</h3>
              <div className="keywords-list">
                {result.missing_keywords.map((keyword, index) => (
                  <span 
                    key={index} 
                    className={`keyword missing ${keyword.importance}`}
                    title={`Importance: ${keyword.importance}`}
                  >
                    {keyword.keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Skills Analysis */}
        <div className="skills-section">
          <h3>Skills Analysis</h3>
          <div className="skills-grid">
            <div className="skills-column">
              <h4>Your Skills</h4>
              <div className="skills-list">
                {result.skills.extracted.map((skill, index) => (
                  <span key={index} className="skill">{skill}</span>
                ))}
              </div>
            </div>
            
            <div className="skills-column">
              <h4>Missing Skills</h4>
              <div className="skills-list">
                {result.skills.missing_relevant.map((skill, index) => (
                  <span key={index} className="skill missing">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Experience Analysis */}
        <div className="experience-section">
          <h3>Experience Analysis</h3>
          <div className="experience-info">
            <p><strong>Total Years of Experience:</strong> {result.experience.total_years} years</p>
            {result.experience.matches.length > 0 && (
              <div className="experience-matches">
                <h4>Role-Specific Experience:</h4>
                {result.experience.matches.map((match, index) => (
                  <div key={index} className={`experience-match ${match.ok ? 'ok' : 'insufficient'}`}>
                    <span>Required: {match.req}</span>
                    <span>Your Experience: {match.candidate}</span>
                    <span className="status">{match.ok ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Formatting Issues */}
        {result.formatting_issues.length > 0 && (
          <div className="formatting-section">
            <h3>Formatting Issues</h3>
            <div className="issues-list">
              {result.formatting_issues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <span className="issue-icon">⚠️</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Suggestions */}
        <div className="suggestions-section">
          <h3>Improvement Suggestions</h3>
          
          {result.suggestions.keyword_insertions.length > 0 && (
            <div className="suggestion-group">
              <h4>Add Missing Keywords</h4>
              <ul className="suggestions-list">
                {result.suggestions.keyword_insertions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.suggestions.resume_bullets_examples.length > 0 && (
            <div className="suggestion-group">
              <h4>Resume Bullet Examples</h4>
              <ul className="suggestions-list">
                {result.suggestions.resume_bullets_examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="suggestion-group">
            <h4>File Recommendation</h4>
            <p>{result.suggestions.file_recommendation}</p>
          </div>
        </div>
        
        {/* Raw Data (Collapsible) */}
        <details className="raw-data-section">
          <summary>View Raw Parsed Data</summary>
          <div className="raw-data-content">
            <div className="raw-data-column">
              <h4>Parsed Resume</h4>
              <pre className="raw-text">{result.raw_parsed_resume}</pre>
            </div>
            <div className="raw-data-column">
              <h4>Parsed Job Description</h4>
              <pre className="raw-text">{result.raw_parsed_jd}</pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ResultsPage;
