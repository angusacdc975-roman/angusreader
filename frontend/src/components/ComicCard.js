import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { ongoing: 'Виходить', completed: 'Завершено', hiatus: 'Пауза' };

// Додаємо жорстко задані непрозорі кольори
const STATUS_STYLES = { 
  ongoing: { bg: '#22c55e', text: '#ffffff', border: '#16a34a' }, 
  completed: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }, 
  hiatus: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' } 
};

export default function ComicCard({ comic, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="comic-card" onClick={() => navigate(`/comic/${comic._id}`)}>
      <div className="comic-card-cover">
        {comic.cover ? (
          <img src={comic.cover} alt={comic.title} loading="lazy" />
        ) : (
          <div className="comic-card-cover-placeholder">📚</div>
        )}
        
        {/* Оновлена плашка з примусовими стилями */}
        <div 
          className="comic-card-status"
          style={{
            backgroundColor: STATUS_STYLES[comic.status]?.bg || '#333',
            color: STATUS_STYLES[comic.status]?.text || '#fff',
            border: `1px solid ${STATUS_STYLES[comic.status]?.border || '#222'}`,
            opacity: 1
          }}
        >
          {STATUS_LABELS[comic.status]}
        </div>

        <div className="comic-card-overlay">
          <div className="chapters-count">📖 {comic.chapters?.length || 0} розділів</div>
        </div>
      </div>
      <div className="comic-card-body">
        <div className="comic-card-title">{comic.title}</div>
        <div className="comic-card-meta">
          <span>👁 {comic.views || 0}</span>
          <span>⭐ {comic.rating ? comic.rating.toFixed(1) : '—'}</span>
        </div>
        {comic.genres?.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {comic.genres.slice(0, 2).map(g => (
              <span key={g} style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>{g}</span>
            ))}
          </div>
        )}
        
        {user?.role === 'admin' && onEdit && onDelete && (
          <div className="admin-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(comic)}>✏️</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(comic)}>🗑️</button>
          </div>
        )}
        
      </div>
    </div>
  );
}