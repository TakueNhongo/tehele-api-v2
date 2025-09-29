import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class DelayMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: any) {
    setTimeout(() => {
      next();
    }, 1000); // delay for 2000 milliseconds (2 seconds)
  }
}
