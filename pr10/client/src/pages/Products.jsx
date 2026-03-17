import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userRes = await apiClient.get('/auth/me');
      setUser(userRes.data);
      
      const prodRes = await apiClient.get('/products');
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  //ФУНКЦИЯ ДЛЯ ТЕСТА ПРАКТИКИ 10
  const simulateTokenExpiry = () => {
    localStorage.setItem('accessToken', 'INVALID_TOKEN_FOR_TEST');
    alert('Access-токен испорчен!\nСледующий запрос к серверу вызовет ошибку 401.\nИнтерцептор должен автоматически отправить запрос на /refresh и повторить операцию.');
    loadData(); //пробуем сделать запрос снова с плохим токеном
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🛒 Магазин (Привет, {user?.first_name}!)</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Выйти
        </button>
      </div>

      {/* КНОПКА ДЛЯ ДЕМОНСТРАЦИИ */}
      <div style={{ background: '#fff3cd', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #ffeeba' }}>
        <h3>Тест Refresh-токена</h3>
        <p>Нажми кнопку ниже, чтобы симулировать истечение срока действия Access-токена.</p>
        <button 
          onClick={simulateTokenExpiry} 
          style={{ padding: '10px 20px', background: '#ffc107', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
        >
          Симулировать истечение токена
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>{p.title || p.name}</h3>
            <p style={{ fontSize: 18, fontWeight: 'bold', color: '#007aff' }}>{p.price} ₽</p>
            <small>{p.category || 'Общее'}</small>
            <p style={{ fontSize: 12, color: '#666' }}>{p.description || ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}