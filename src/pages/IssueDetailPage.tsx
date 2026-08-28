import React from 'react';
import { useParams } from 'react-router-dom';

export const IssueDetailPage: React.FC = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dettaglio Issue</h2>
      <p>
        Progetto ID: <strong>{projectId}</strong> | Issue ID: <strong>{issueId}</strong>
      </p>
    </div>
  );
};
