import { RobotService } from './robot.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [RobotService],
  exports: [RobotService],
})
export class RobotModule {}
