import type { LoginPayload, LoginResponse } from '../types/shared';
import { adminCredentials, testCredentials } from '../data/seed';
import { dataRepository } from '../repositories';

class AuthService {
  async login(payload: LoginPayload): Promise<LoginResponse | null> {
    const email = payload.email.trim().toLowerCase();

    if (email === testCredentials.email && payload.password === testCredentials.password) {
      return {
        token: 'demo-readonly-user_test_1',
        user: {
          id: 'user_test_1',
          name: 'Test User',
          email: testCredentials.email,
          role: 'admin',
        },
      };
    }

    if (email !== adminCredentials.email || payload.password !== adminCredentials.password) {
      return null;
    }

    const user = await dataRepository.getUser();

    return {
      token: `demo-token-${user.id}`,
      user,
    };
  }
}

export const authService = new AuthService();
