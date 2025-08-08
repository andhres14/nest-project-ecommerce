import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";

import { User } from "../entities/user.entity";
import { JwtPayload } from "../interfaces/payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ) {

    constructor(
        @InjectRepository( User )
        private readonly userRepository: Repository<User>,
        configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET') as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }

    async validate( payload: JwtPayload ): Promise<User> {
        const { uid } = payload;

        const user = await this.userRepository.findOneBy({ id: uid });

        if (!user)
            throw new UnauthorizedException('Token not valid');

        if (!user.isActive)
            throw new UnauthorizedException('User is inactived, talk with an admin');

        return user;
    }
}