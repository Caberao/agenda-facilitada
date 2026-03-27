import type { LoginPayload, LoginResponse } from '../types/shared';
import { adminCredentials } from '../data/seed';
import { dataRepository } from '../repositories';

class AuthService {
  login(payload: LoginPayload): LoginResponse | null {
    const email = payload.email.trim().toLowerCase();

    if (email !== adminCredentials.email || payload.password !== adminCredentials.password) {
      return null;
    }

    const user = dataRepository.getUser();

    return {
      token: `demo-token-${user.id}`,
      user,
    };
  }
}

export const authService = new AuthService();
