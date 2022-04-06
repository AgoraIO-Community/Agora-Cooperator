import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './profile.entity';
import { SessionModule } from '../session/session.module';
import { SignalModule } from '../signal/signal.module';
import { StreamModule } from '../stream/stream.module';
import { WhiteboardModule } from '../whiteboard/whiteboard.module';
import { RobotModule } from '../robot/robot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity]),
    SessionModule,
    SignalModule,
    StreamModule,
    WhiteboardModule,
    RobotModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
