import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ComicModal from '../components/ComicModal';
import DeleteModal from '../components/DeleteModal';
import ChapterModal from '../components/ChapterModal';
import Comments from '../components/Comments';

const STATUS_LABELS = { ongoing: '🟢 Виходить', completed: '🔵 Завершено', hiatus: '🟡 Пауза' };

export default function ComicDetail() {
  const { id } = useParams();
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Стани для розділів
  const [chapterOpen, setChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null); // НОВЕ: зберігає розділ для редагування
  const [delChapter, setDelChapter] = useState(null);
  
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get(`/comics/${id}`).then(r => setComic(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (user && comic) setBookmarked(user.bookmarks?.includes(comic._id));
  }, [user, comic]);

  const toggleBookmark = async () => {
    if (!user) return navigate('/login');
    await api.post(`/auth/bookmark/${comic._id}`);
    setBookmarked(b => !b);
    addToast(bookmarked ? 'Видалено із закладок' : 'Додано до закладок');
  };

  const handleDelete = async () => {
    await api.delete(`/comics/${comic._id}`);
    addToast('Комікс видалено');
    navigate('/catalog');
  };

  const handleDeleteChapter = async () => {
    // ЗМІНЕНО: тепер видаляємо за _id, щоб бекенд міг почистити Cloudinary
    await api.delete(`/comics/${comic._id}/chapters/${delChapter._id}`);
    addToast('Розділ видалено');
    setDelChapter(null);
    load();
  };

  const handleRate = async (ratingValue) => {
    if (!user) {
      addToast('Будь ласка, увійдіть в акаунт, щоб оцінити комікс');
      return;
    }
    try {
      const { data } = await api.post(`/comics/${comic._id}/rate`, { rating: ratingValue });
      // Оновлюємо дані на екрані без перезавантаження сторінки
      setComic(prev => ({ ...prev, rating: data.rating, ratingCount: data.ratingCount }));
      addToast('Дякуємо за вашу оцінку!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Сталася помилка при оцінюванні');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>;
  if (!comic) return <div className="empty-state"><div className="empty-state-text">Комікс не знайдено</div></div>;

  return (
    <div className="comic-detail">
      <div className="comic-detail-header">
        <div className="comic-detail-cover">
          {comic.cover ? <img src={comic.cover} alt={comic.title} /> : <div style={{ height: 340, background: 'var(--bg-elevated)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:64 }}>📚</div>}
        </div>
        <div className="comic-detail-info">
          <div className="comic-detail-title">{comic.title}</div>
          <div className="comic-detail-author">
            {comic.author && <span> {comic.author}</span>}
            {comic.artist && comic.artist !== comic.author && <span style={{ marginLeft: 12 }}> {comic.artist}</span>}
          </div>
          <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 14 }}>
            {STATUS_LABELS[comic.status]} {comic.year && `• ${comic.year}`}
          </div>
          <div className="hero-genres" style={{ marginBottom: 16 }}>
            {comic.genres?.map(g => <span key={g} className="genre-tag">{g}</span>)}
          </div>
          <div className="comic-detail-stats">
            <div className="stat-item"><div className="stat-value">{comic.views || 0}</div><div className="stat-label">Перегляди</div></div>
            <div className="stat-item"><div className="stat-value">{comic.chapters?.length || 0}</div><div className="stat-label">Розділи</div></div>
            <div className="stat-item"><div className="stat-value">{comic.rating ? comic.rating.toFixed(1) : '—'}</div><div className="stat-label">Рейтинг</div></div>
          </div>
          <div className="comic-detail-desc">{comic.description}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {comic.chapters?.length > 0 && (
              <button className="btn btn-primary" onClick={() => navigate(`/read/${comic._id}/1`)}>📖 Читати з початку</button>
            )}
            <button className={`btn btn-ghost`} onClick={toggleBookmark}>{bookmarked ? '🔖 В закладках' : '+ Закладки'}</button>
            {user?.role === 'admin' && (
              <>
                <button className="btn btn-ghost" onClick={() => setEditOpen(true)}> Редагувати</button>
                {/* ЗМІНЕНО: При створенні нового розділу скидаємо editingChapter в null */}
                <button className="btn btn-ghost" onClick={() => { setEditingChapter(null); setChapterOpen(true); }}>+ Розділ</button>
                <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}> Видалити</button>
              </>
            )}
          </div>
        </div>
        
        {/* Інтерактивний рейтинг */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', width: 'fit-content' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Оцінити комікс:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => handleRate(star)}
                style={{
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: Math.round(comic.rating || 0) >= star ? 'var(--gold)' : 'var(--text-muted)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.target.style.transform = 'scale(0.8)'}
                onMouseUp={e => e.target.style.transform = 'scale(1)'}
                title={`Оцінити на ${star}`}
              >
                ★
              </span>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            (Оцінок: {comic.ratingCount || 0})
          </span>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Розділи ({comic.chapters?.length || 0})</h2>
      </div>
      {comic.chapters?.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-text">Розділів поки немає</div></div>
      ) : (
        <div className="chapters-list">
          {[...comic.chapters].sort((a, b) => b.number - a.number).map(ch => (
            <div key={ch._id} className="chapter-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div 
                style={{ cursor: 'pointer', flexGrow: 1 }} 
                onClick={() => navigate(`/read/${comic._id}/${ch.number}`)}
              >
                <span className="chapter-num">Розділ {ch.number}</span>
                {ch.title && <span className="chapter-title" style={{ marginLeft: 12 }}>{ch.title}</span>}
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="chapter-date">{new Date(ch.publishedAt || Date.now()).toLocaleDateString('uk-UA')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 10 }}>👁 {ch.views || 0}</span>
                
                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* НОВЕ: Кнопка редагування */}
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ padding: '4px 8px', backgroundColor: '#333', borderRadius: '4px' }}
                      onClick={(e) => { e.stopPropagation(); setEditingChapter(ch); setChapterOpen(true); }}
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={(e) => { e.stopPropagation(); setDelChapter(ch); }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editOpen && <ComicModal comic={comic} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />}
      {deleteOpen && <DeleteModal title={comic.title} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />}
      
      {/* ЗМІНЕНО: Тепер ми передаємо об'єкт chapter (для редагування) або null (для створення) */}
      {chapterOpen && (
        <ChapterModal 
          comicId={comic._id} 
          chapter={editingChapter} 
          onClose={() => setChapterOpen(false)} 
          onSaved={() => { setChapterOpen(false); load(); }} 
        />
      )}
      
      {delChapter && <DeleteModal title={`Розділ ${delChapter.number}`} onClose={() => setDelChapter(null)} onConfirm={handleDeleteChapter} />}
      
      <div className="section-header" style={{ marginTop: '40px' }}>
        <h2 className="section-title">Обговорення</h2>
      </div>
      <Comments comicId={comic._id} initialComments={comic.comments || []} />
    </div>
  );
}