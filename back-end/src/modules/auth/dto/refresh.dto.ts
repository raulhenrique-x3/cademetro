import { ApiProperty } from '@nestjs/swagger';
import Joi from 'joi';

export class RefreshTokenDto {
  @ApiProperty({ example: 'dGhpcy1pcy1hLXJlZnJlc2gtdG9rZW4uLi4' })
  refreshToken!: string;

  static schema = Joi.object({
    refreshToken: Joi.string().required(),
  });
}