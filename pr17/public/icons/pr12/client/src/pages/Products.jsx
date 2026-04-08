import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', category: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  //получаем данные из localStorage (Практика 10)
  const userRole = localStorage.getItem('userRole') || '';
  const userName = localStorage.getItem('userName') || '';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout'); //добавляем токен в blacklist
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await apiClient.post('/products', newProduct);
      setProducts([...products, res.data]);
      setNewProduct({ title: '', price: '', category: '' });
      alert('Товар создан!');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return;

    try {
      await apiClient.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      alert('Товар удалён!');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  //проверяем роль
  const canCreate = ['admin', 'moderator'].includes(userRole);
  const canDelete = userRole === 'admin';

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🛒 Магазин (Привет, {userName}! Роль: {userRole})</h2>
        <button onClick={handleLogout} className="btn btn-danger">
          Выйти
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>
      )}

      {/* Форма создания - только для admin/moderator (RBAC) */}
      {canCreate && (
        <div className="card">
          <h3>➕ Добавить товар</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Название"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              required
              style={{ flex: 1, minWidth: 150 }}
            />
            <input
              type="number"
              placeholder="Цена"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
              style={{ width: 100 }}
            />
            <input
              placeholder="Категория"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              style={{ flex: 1, minWidth: 150 }}
            />
            <button type="submit" className="btn btn-success">
              Создать
            </button>
          </form>
        </div>
      )}

      {/* Список товаров */}
      <div style={{ marginTop: 20 }}>
        <h3>Список товаров ({products.length})</h3>
        {products.length === 0 ? (
          <p>Товаров пока нет</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.title}</strong>
                <div style={{ color: '#007aff', fontWeight: 'bold' }}>{p.price} ₽</div>
                <small>{p.category || 'Общее'}</small>
              </div>
              {canDelete && (
                <button onClick={() => handleDelete(p.id)} className="btn btn-danger">
                  Удалить
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}