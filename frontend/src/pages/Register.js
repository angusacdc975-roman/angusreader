import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.username.trim() || form.username.length < 3) e.username = 'Мінімум 3 символи';
    if (!form.email.includes('@')) e.email = 'Некоректний email';
    if (form.password.length < 6) e.password = 'Мінімум 6 символів';
    if (form.password !== form.confirm) e.confirm = 'Паролі не збігаються';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      addToast('Акаунт створено!');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Помилка', 'error');
    } finally { setLoading(false); }
  };

  const field = (key) => ({
    className: 'form-input', value: form[key],
    onChange: e => setForm({...form, [key]: e.target.value})
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: 20 }}>
      <div className="modal" style={{ maxWidth: 420, width: '100%' }}>
        <div className="modal-title" style={{ textAlign: 'center' }}>✨ Реєстрація</div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>Створіть акаунт в AngusReader</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ім'я користувача</label>
            <input {...field('username')} placeholder="username" />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input {...field('email')} type="email" placeholder="your@email.com" />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input {...field('password')} type="password" placeholder="••••••••" />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Підтвердіть пароль</label>
            <input {...field('confirm')} type="password" placeholder="••••••••" />
            {errors.confirm && <div className="form-error">{errors.confirm}</div>}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 20 }}>
          Вже є акаунт? <Link to="/login" style={{ color: 'var(--accent)' }}>Увійти</Link>
        </p>
      </div>
    </div>
  );
}
