import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ComicCard from '../components/ComicCard';

export default function Home() {
  const [popular, setPopular] = useState([]);
  const [latest, setLatest] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/comics/popular'), api.get('/comics/latest')])
      .then(([p, l]) => { setPopular(p.data); setLatest(l.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (popular.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % Math.min(popular.length, 5)), 5000);
    return () => clearInterval(t);
  }, [popular]);

  const hero = popular[heroIdx];

  if (loading) return <div className="loading-spinner"><div className="spinner"/><span>Завантаження...</span></div>;

  return (
    <>
      {/* Hero */}
      {hero && (
        <div className="hero">
          <div className="hero-bg" style={{ backgroundImage: `url(${hero.cover || ''})` }} />
          <div className="hero-gradient" />
          <div className="hero-content">
            <div className="hero-badge">🔥 #{heroIdx + 1} Популярне</div>
            <div className="hero-title">{hero.title}</div>
            <div className="hero-genres">
              {hero.genres?.slice(0, 4).map(g => <span key={g} className="genre-tag">{g}</span>)}
            </div>
            <div className="hero-desc">{hero.description}</div>
            <button className="btn btn-primary" onClick={() => navigate(`/comic/${hero._id}`)}>
               Читати
            </button>
            <div className="hero-dots">
              {popular.slice(0, 5).map((_, i) => (
                <div key={i} className={`hero-dot ${i === heroIdx ? 'active' : ''}`} onClick={() => setHeroIdx(i)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Популярне</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/catalog')}>Всі →</button>
        </div>
        {popular.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📚</div><div className="empty-state-text">Поки що немає коміксів</div></div>
        ) : (
          <div className="comics-grid comics-grid-large">
            {popular.slice(0, 10).map(c => <ComicCard key={c._id} comic={c} />)}
          </div>
        )}
      </div>

     
    
    </>
  );
}
