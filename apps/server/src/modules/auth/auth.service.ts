import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing) throw new ConflictException('Username already exists');

    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, password: hash });
    await this.userRepo.save(user);
    return this.signToken(user);
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'password'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new BadRequestException('Old password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { ok: true };
  }

  async ensureAdmin() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.userRepo.save(this.userRepo.create({ username: 'admin', password: hash }));
    }
  }

  private signToken(user: User) {
    const payload = { sub: user.id, username: user.username };
    return { token: this.jwtService.sign(payload) };
  }
}
