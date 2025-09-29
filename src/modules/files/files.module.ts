import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { UserModule } from '../user/user.module';
import { BusboyMiddleware } from 'src/middleware/busboy';
import { StartupModule } from '../startup/startup.module';
import { InvestorModule } from '../investor/investor.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => StartupModule),
    forwardRef(() => InvestorModule),
  ],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BusboyMiddleware)
      .forRoutes({ path: 'files/upload', method: RequestMethod.POST });
  }
}
