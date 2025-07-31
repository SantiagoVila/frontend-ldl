import axios from 'axios';

const api = axios.create({
  // Añadimos /api al final de la URL base
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

export default api;