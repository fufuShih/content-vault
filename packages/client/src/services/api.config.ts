const DEV_API_URL = 'http://localhost:3000/api';
const PROD_API_URL = '/api';

export const API_BASE_URL = import.meta.env.DEV ? DEV_API_URL : PROD_API_URL;

export const buildUrl = (path: string) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
};
