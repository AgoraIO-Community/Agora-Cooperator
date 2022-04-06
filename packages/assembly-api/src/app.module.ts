import { RobotModule } from './robot/robot.module';
import { WhiteboardModule } from './whiteboard/whiteboard.module';
import { SignalModule } from './signal/signal.module';
import { StreamModule } from './stream/stream.module';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './session/session.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
const __PROD__ = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    RobotModule,
    WhiteboardModule,
    SignalModule,
    StreamModule,
    ProfileModule,
    SessionModule,
    ConfigModule.forRoot({
      envFilePath: __PROD__ ? undefined : '.env.development.local',
      ignoreEnvFile: __PROD__,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const options: TypeOrmModuleOptions = {
          type: 'mysql',
          host: config.get<string>('DATABASE_HOST'),
          port: config.get<number>('DATABASE_PORT'),
          username: config.get<string>('DATABASE_USERNAME'),
          password: config.get<string>('DATABASE_PASSWORD'),
          database: config.get<string>('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          loggerLevel: 'debug',
          logging: true,
        };
        Logger.debug(`Connecting to database: ${JSON.stringify(options)}`);
        return options;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
