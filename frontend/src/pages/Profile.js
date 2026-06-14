import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Load bookmarked comics
    if (user.bookmarks?.length) {
      Promise.all(user.bookmarks.slice(0, 20).map(id => api.get(`/comics/${id}`).catch(() => null)))
        .then(res => setBookmarks(res.filter(Boolean).map(r => r.data)));
    }
  }, [user]);

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="section" style={{ maxWidth: 800 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Oswald', fontSize: 28, fontWeight: 700 }}>{user.username}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.email}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: user.role === 'admin' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.06)', color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {user.role === 'admin' ? '⚙️ Адміністратор' : '👤 Користувач'}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Вийти</button>
        </div>
      </div>

      <h2 className="section-title" style={{ marginBottom: 20 }}>🔖 Закладки</h2>
      {bookmarks.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔖</div><div className="empty-state-text">Закладок поки немає</div></div>
      ) : (
        <div className="comics-grid">
          {bookmarks.map(c => (
            <div key={c._id} className="comic-card" onClick={() => navigate(`/comic/${c._id}`)}>
              <div className="comic-card-cover">
                {c.cover ? <img src={c.cover} alt={c.title} /> : <div className="comic-card-cover-placeholder">📚</div>}
              </div>
              <div className="comic-card-body">
                <div className="comic-card-title">{c.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
