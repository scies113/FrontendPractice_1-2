import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', //порт сервера
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  //получить все товары
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },
  
  //добавить товар
  createProduct: async (product) => {
    const response = await apiClient.post('/products', product);
    return response.data;
  },
  
  //обновить товар
  updateProduct: async (id, product) => {
    const response = await apiClient.patch(`/products/${id}`, product);
    return response.data;
  },
  
  //удалить товар
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};