import { Trash2, Calendar, RefreshCw } from 'lucide-react';
import type { QAPair } from '../App';

interface HistoryViewProps {
  isLoadingHistory: boolean;
  history: QAPair[];
  deletePair: (id: number) => void;
  parseUTCTimestamp: (ts: string) => Date;
}

export default function HistoryView({
  isLoadingHistory,
  history,
  deletePair,
  parseUTCTimestamp
}: HistoryViewProps) {
  return (
    <div className="history-view-container">
      <div className="history-container">
        {isLoadingHistory ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            <RefreshCw size={24} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
            <span>Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-history" style={{ padding: '40px 20px' }}>
            No conversation records. Start an interview to capture your thoughts!
          </div>
        ) : (
          <div className="history-list-wrapper">
            {history.map((item) => (
              <div key={item.id} className="history-block">
                <div className="history-block-q">Q: {item.question}</div>
                <div className="history-block-a">A: {item.answer}</div>
                <div className="history-block-footer">
                  <span>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {parseUTCTimestamp(item.timestamp).toLocaleDateString()}{' '}
                    {parseUTCTimestamp(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button 
                  className="history-block-trash" 
                  onClick={() => deletePair(item.id)} 
                  title="Delete QA pair"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
