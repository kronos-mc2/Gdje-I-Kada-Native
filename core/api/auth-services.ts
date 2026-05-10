import { apiClient } from '@/core/api/http-client';
import { AuthResponse, LoginPayload, RegisterPayload, UserProfile } from '@/core/types/domain';

export const loginWithEmail = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const registerWithEmail = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/google', { idToken });
  return response.data;
};

export const loginWithApple = async (idToken: string, name?: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/apple', { idToken, name });
  return response.data;
};

export const fetchMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
};
