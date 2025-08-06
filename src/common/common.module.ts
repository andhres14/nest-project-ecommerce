import { Module } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler/error-handler.service';

@Module({
  providers: [ErrorHandlerService],
  exports: [ErrorHandlerService]
})
export class CommonModule {}
