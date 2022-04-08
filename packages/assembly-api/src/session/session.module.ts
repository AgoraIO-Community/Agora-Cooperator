import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Module } from '@nestjs/common';
import { SessionEntity } from './session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalEntity } from '../signal/signal.entity';
import { SignalModule } from '../signal/signal.module';
import { WhiteboardModule } from '../whiteboard/whiteboard.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity, SignalEntity]), SignalModule, WhiteboardModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
