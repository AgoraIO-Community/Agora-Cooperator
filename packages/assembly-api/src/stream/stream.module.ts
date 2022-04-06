import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamEntity } from './stream.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StreamEntity])],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
