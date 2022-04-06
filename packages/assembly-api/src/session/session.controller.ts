import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { Profile, Session } from 'assembly-shared';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(
    @Inject(SessionService)
    private services: SessionService,
  ) {}

  @Post('/')
  createSession(@Body() body: Pick<Session, 'channel'>) {
    Logger.debug(`SessionController.createSession: ${JSON.stringify(body)}`);
    return this.services.createSession(body.channel);
  }

  @Get('/:id')
  findSession(@Param('id') id: string) {
    Logger.debug(`SessionController.findSession: ${id}`);
    return this.services.findSession(id);
  }
}
