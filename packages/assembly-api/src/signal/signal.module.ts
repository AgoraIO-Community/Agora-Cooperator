import { SignalService } from './signal.service';
import { SignalController } from './signal.controller';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalEntity } from './signal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SignalEntity])],
  controllers: [SignalController],
  providers: [SignalService],
  exports: [SignalService],
})
export class SignalModule {}
