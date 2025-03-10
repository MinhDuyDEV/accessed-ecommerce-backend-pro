import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw an error if no token is provided
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err, user, _info) {
    return user;
  }
}
