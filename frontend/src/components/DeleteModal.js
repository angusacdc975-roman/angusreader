export default function DeleteModal({ title, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-title">🗑️ Видалити?</div>
        <p className="delete-confirm">
          Ви впевнені, що хочете видалити <strong>"{title}"</strong>? Цю дію неможливо скасувати.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Скасувати</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  );
}
