import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(phone: string, pass: string) {
    // Mock login logic
    if (phone && pass) {
      const payload = { phone, sub: 'mock-user-id', role: 'user' };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException();
  }
}
