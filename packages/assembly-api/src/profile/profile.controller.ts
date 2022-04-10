import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ProfileEntity } from './profile.entity';
import { ProfileService } from './profile.service';

@Controller('/session/:sessionId/profile')
export class ProfileController {
  constructor(@Inject(ProfileService) private profileService: ProfileService) {}

  @Post()
  async createProfile(
    @Param('sessionId') sessionId: string,
    @Body() profile: Pick<ProfileEntity, 'username' | 'role'>,
  ) {
    Logger.debug(`createProfile: ${sessionId}, ${JSON.stringify(profile)}`);
    return await this.profileService.createProfile(sessionId, profile);
  }

  @Get('/:id')
  async getProfile(
    @Param('sessionId') _sessionId: string,
    @Param('id') id: string,
  ) {
    Logger.debug(`getProfile: ${_sessionId}, ${id}`);
    return await this.profileService.findProfile(id);
  }

  @Put('/:id')
  async updateProfile(
    @Param('sessionId') sessionId: string,
    @Param('id') profileId: string,
    @Body()
    profile: Pick<
      ProfileEntity,
      | 'rdcStatus'
      | 'markable'
      | 'screenShare'
      | 'streams'
      | 'screenVisibility'
    >,
  ) {
    return await this.profileService.updateProfile(
      sessionId,
      profileId,
      profile,
    );
  }

  @Patch('/:id')
  async checkIn(
    @Param('sessionId') sessionId: string,
    @Param('id') profileId: string,
    @Body() { isIn }: { isIn: boolean },
  ) {
    Logger.debug(`ProfileController.checkIn: ${sessionId} ${profileId}`);
    return this.profileService.checkInOut(sessionId, profileId, isIn);
  }
}
