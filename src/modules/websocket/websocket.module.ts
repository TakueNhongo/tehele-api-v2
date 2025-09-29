import { forwardRef, Module } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { UserModule } from '../user/user.module';
@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
