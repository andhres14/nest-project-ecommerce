import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { ErrorHandlerService } from 'src/common/services/error-handler/error-handler.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly errorHandleService: ErrorHandlerService,
    private readonly jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user);
      delete user.password;

      return { ...user, token: this.getJwtToken( { uid: user.id } ) };
    } catch (error) {
      this.errorHandleService.errorHandle(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, id: true, password: true }
    });

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if (!bcrypt.compareSync( password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)');
    
    delete user.password;

    return { ...user, token: this.getJwtToken( { uid: user.id } ) };
  }

  private getJwtToken( payload: JwtPayload ) {
    // generate jwt token
    const token = this.jwtService.sign( payload );
    return token;
  }

  async checkAuthStatus(user: User) {

    return {
      ...user,
      token: this.getJwtToken({ uid: user.id })
    }
  }

}
