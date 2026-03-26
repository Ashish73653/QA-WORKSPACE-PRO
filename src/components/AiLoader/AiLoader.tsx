import './AiLoader.css';

interface AiLoaderProps {
  message?: string;
  subMessage?: string;
}

export function AiLoader({ message = 'AI is thinking...', subMessage }: AiLoaderProps) {
  return (
    <div className="ai-loader-container">
      <div className="ai-loader-orb">
        <div className="ai-loader-ring ring-1" />
        <div className="ai-loader-ring ring-2" />
        <div className="ai-loader-ring ring-3" />
        <div className="ai-loader-core">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
            <path d="M8.24 4.47A4 4 0 0 1 12 2" />
            <path d="M12 6v.01" />
            <path d="M4.93 4.93a8 8 0 0 0 0 14.14" />
            <path d="M19.07 4.93a8 8 0 0 1 0 14.14" />
            <path d="M12 12l-1 1" />
            <path d="M12 22a4 4 0 0 1-4-4c0-1.95 1.4-3.58 3.25-3.93" />
            <path d="M15.76 19.53A4 4 0 0 1 12 22" />
            <path d="M12 18v-.01" />
          </svg>
        </div>
      </div>
      <div className="ai-loader-text">
        <span className="ai-loader-message">{message}</span>
        {subMessage && <span className="ai-loader-sub">{subMessage}</span>}
      </div>
      <div className="ai-loader-dots">
        <span className="ai-dot" />
        <span className="ai-dot" />
        <span className="ai-dot" />
      </div>
    </div>
  );
}

export function AiLoaderInline({ message = 'Generating...' }: { message?: string }) {
  return (
    <div className="ai-loader-inline">
      <div className="ai-loader-inline-spinner">
        <div className="ai-spinner-ring" />
      </div>
      <span className="ai-loader-inline-text">{message}</span>
    </div>
  );
}
