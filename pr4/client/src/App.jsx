import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить товары. Проверьте, запущен ли сервер!');
    } finally {
      setLoading(false);
    }
  };

  //обработка вводных данных
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    //валидация
    if (!formData.name || !formData.price) {
      alert('Введите название и цену');
      return;
    }

    try {
      if (isEditing) {
        //редактирования
        await api.updateProduct(editId, formData);
        alert('Товар обновлен!');
      } else {
        //создания
        await api.createProduct(formData);
        alert('Товар добавлен!');
      }
      
      resetForm();
      loadProducts();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || '',
      description: product.description || '',
      stock: product.stock || ''
    });
    setIsEditing(true);
    setEditId(product.id);
    window.scrollTo(0, 0);
  };

  //удаление(товар)
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  //сброс формы
  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '', stock: '' });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="app-container">
      <header>
        <h1>🛒 Магазин товаров (React + Express)</h1>
      </header>

      <main>
        {/* форма добавления/редактирования */}
        <section className="form-section">
          <h2>{isEditing ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <input name="name" placeholder="Название" value={formData.name} onChange={handleChange} required />
            <input name="price" type="number" placeholder="Цена" value={formData.price} onChange={handleChange} required />
            <input name="category" placeholder="Категория" value={formData.category} onChange={handleChange} />
            <input name="description" placeholder="Описание" value={formData.description} onChange={handleChange} />
            <input name="stock" type="number" placeholder="Количество" value={formData.stock} onChange={handleChange} />
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {isEditing ? 'Сохранить изменения' : 'Добавить товар'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="btn-secondary">Отмена</button>
              )}
            </div>
          </form>
        </section>

        {/* список товаров */}
        <section className="list-section">
          <h2>Список товаров ({products.length})</h2>
          
          {loading ? (
            <p>Загрузка...</p>
          ) : products.length === 0 ? (
            <p>Товаров пока нет.</p>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="card-header">
                    <h3>{product.name}</h3>
                    <span className="price">{product.price} ₽</span>
                  </div>
                  <div className="card-body">
                    <p><strong>Категория:</strong> {product.category}</p>
                    <p><strong>Описание:</strong> {product.description}</p>
                    <p><strong>На складе:</strong> {product.stock} шт.</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(product)} className="btn-edit">Ред.</button>
                    <button onClick={() => handleDelete(product.id)} className="btn-delete">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;