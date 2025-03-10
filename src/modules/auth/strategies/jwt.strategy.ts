import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { access_token_public_key } from '../../../common/utils/keys.util';
import { UserStatus } from '../../users/entities/user.entity';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: access_token_public_key,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOneWithRoles(payload.sub);

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    return user;
  }
}
