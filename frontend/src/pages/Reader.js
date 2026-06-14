import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Reader() {
  const { comicId, chapterNum } = useParams();
  const [chapter, setChapter] = useState(null);
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const num = Number(chapterNum);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/comics/${comicId}/chapter/${num}`),
      api.get(`/comics/${comicId}`)
    ]).then(([ch, cm]) => { setChapter(ch.data); setComic(cm.data); })
      .finally(() => setLoading(false));
  }, [comicId, num]);

  const maxChapter = comic?.chapters?.length ? Math.max(...comic.chapters.map(c => c.number)) : 1;
  const minChapter = comic?.chapters?.length ? Math.min(...comic.chapters.map(c => c.number)) : 1;

  if (loading) return <div className="reader-page loading-spinner" style={{ background: '#000' }}><div className="spinner" /></div>;
  if (!chapter) return <div className="reader-page" style={{ display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>Розділ не знайдено</div>;

  return (
    <div className="reader-page">
      <div className="reader-navbar">
        <Link to={`/comic/${comicId}`} style={{ color: 'white', fontSize: 14 }}>← {comic?.title}</Link>
        <div style={{ color: 'white', fontWeight: 700 }}>Розділ {num}{chapter.title ? ` — ${chapter.title}` : ''}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'white' }}
            disabled={num <= minChapter} onClick={() => navigate(`/read/${comicId}/${num - 1}`)}>‹ Попередній</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'white' }}
            disabled={num >= maxChapter} onClick={() => navigate(`/read/${comicId}/${num + 1}`)}>Наступний ›</button>
        </div>
      </div>

      <div className="reader-pages">
        {chapter.pages?.length === 0 ? (
          <div style={{ color: 'white', padding: '100px 20px', textAlign: 'center', fontSize: 18 }}>Сторінок немає</div>
        ) : (
          chapter.pages.map((page, i) => (
            <img key={i} className="reader-page-img" src={page} alt={`Сторінка ${i + 1}`} loading="lazy" />
          ))
        )}
      </div>

      <div className="reader-nav">
        <button className="btn btn-ghost" style={{ color: 'white' }}
          disabled={num <= minChapter} onClick={() => navigate(`/read/${comicId}/${num - 1}`)}>‹ Попередній</button>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Розділ {num}</span>
        <button className="btn btn-primary"
          disabled={num >= maxChapter} onClick={() => navigate(`/read/${comicId}/${num + 1}`)}>Наступний ›</button>
      </div>
    </div>
  );
}
