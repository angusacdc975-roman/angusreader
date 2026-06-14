import React, { useState } from 'react';
import api from '../utils/api'; // Використовуємо ваш налаштований axios!
import { useAuth } from '../context/AuthContext'; // Підключаємо ваш контекст авторизації

const Comments = ({ comicId, initialComments = [] }) => {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  // Отримуємо поточного користувача через ВАШ контекст
  const { user } = useAuth();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      // Ваш файл api вже автоматично додає токен, тому нам не потрібно писати headers!
     const { data } = await api.post(`/comics/${comicId}/comments`, { 
        text: text, 
        username: user.name || user.username || 'Користувач' // Додали підстраховку
      });

      // Оновлюємо список коментарів
      setComments(data);
      setText(''); 
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Сталася помилка при відправці коментаря');
    }
  };

  return (
    <div className="comments-wrapper" style={{ marginTop: '2rem' }}>
      <h3>Коментарі ({comments.length})</h3>

      {/* Тепер ми перевіряємо зміну user з вашого AuthContext */}
      {user ? (
        <form onSubmit={submitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <textarea
            rows="3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Що думаєте про цей комікс, ${user.username}?`}
            required
            style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#1e1e24', color: 'white', border: '1px solid #333' }}
          />
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Відправити
          </button>
        </form>
      ) : (
        <p style={{ color: '#888', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
          Будь ласка, увійдіть в акаунт, щоб залишити коментар.
        </p>
      )}

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {comments.map((comment, index) => (
          <div key={index} style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#aaa' }}>
              <strong style={{ color: '#fff' }}>{comment.username}</strong>
              <span>{new Date(comment.createdAt).toLocaleDateString('uk-UA')}</span>
            </div>
            <p style={{ margin: 0 }}>{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;