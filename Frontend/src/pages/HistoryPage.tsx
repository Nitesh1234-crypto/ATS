import React from 'react';
import { Link } from 'react-router-dom';
import './HistoryPage.css';

const HistoryPage: React.FC = () => {
  // This is a placeholder----> mock data 
  const mockHistory = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      date: '2024-01-15',
      jobTitle: 'Senior React Developer',
      company: 'Tech Corp',
      score: 78,
      status: 'completed'
    },
    {
      id: '987fcdeb-51a2-43d1-9e8f-765432109876',
      date: '2024-01-10',
      jobTitle: 'Full Stack Engineer',
      company: 'Startup Inc',
      score: 65,
      status: 'completed'
    }
  ];
  
  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <h2>Analysis History</h2>
          <Link to="/" className="new-analysis-btn">New Analysis</Link>
        </div>
        
        {mockHistory.length === 0 ? (
          <div className="empty-history">
            <p>No previous analyses found.</p>
            <Link to="/" className="start-analysis-btn">Start Your First Analysis</Link>
          </div>
        ) : (
          <div className="history-list">
            {mockHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-content">
                  <div className="history-item-header">
                    <h3>{item.jobTitle}</h3>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="company">{item.company}</p>
                  <p className="date">{item.date}</p>
                  {item.score && (
                    <div className="score-display">
                      <span className="score-label">Score:</span>
                      <span className={`score-value ${item.score >= 80 ? 'excellent' : item.score >= 60 ? 'good' : 'fair'}`}>
                        {item.score}
                      </span>
                    </div>
                  )}
                </div>
                <div className="history-item-actions">
                  <Link 
                    to={`/results/${item.id}`} 
                    className="view-results-btn"
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="history-note">
          <p>
            <strong>Note:</strong> This is a demo version. In a production application, 
            you would see your actual analysis history with persistent storage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
