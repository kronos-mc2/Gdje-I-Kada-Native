import axios from 'axios';

const fallbackBaseUrl = 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
  timeout: 7000,
});
