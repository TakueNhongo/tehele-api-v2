import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
} from 'src/modules/session/schemas/session.schema';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { RequestWithUser } from 'src/types/requests.type';
import { UserDocument } from 'src/modules/user/schemas/user.schema';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token && !isPublic) {
      throw new UnauthorizedException('Authorization token is missing');
    }

    if (token) {
      try {
        const decoded: any = this.jwtService.verify(token);

        if (!decoded.id || !decoded.sessionId) {
          throw new UnauthorizedException('Invalid token');
        }

        // Check if session exists and is valid
        const session = await this.sessionModel.findOne({
          sessionId: decoded.sessionId,
        });

        if (!session) {
          throw new UnauthorizedException('Session is invalid or expired');
        }

        // Attach user to request object
        const user = (await this.userService.findById(
          decoded.id,
        )) as UserDocument;
        if (!user) throw new UnauthorizedException('User does not exist');

        // Get profile type and ID from headers
        const profileType = request.headers['x-profile-type'] as
          | 'startup'
          | 'investor';
        const profileId = request.headers['x-profile-id'] as string;

        // Validate profile type if provided
        if (profileType && !['startup', 'investor'].includes(profileType)) {
          throw new UnauthorizedException('Invalid profile type');
        }

        // Validate profile ID if provided
        if (profileId && !Types.ObjectId.isValid(profileId)) {
          throw new UnauthorizedException('Invalid profile ID');
        }

        // Attach everything to the request
        request.user = user;
        request.sessionId = decoded.sessionId;
        request.profileType = profileType;
        request.profileId = profileId
          ? new Types.ObjectId(profileId)
          : undefined;

        return true;
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
    if (isPublic) return true;

    throw new UnauthorizedException('Invalid or expired token');
  }

  private extractTokenFromHeader(request: RequestWithUser): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const [, token] = authHeader.split(' ');
    return token;
  }
}
