import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Joi from 'joi';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 's3cret!P', minLength: 8 })
  password!: string;

  @ApiPropertyOptional({ example: 'metro_user' })
  username?: string;

  @ApiPropertyOptional({ example: 'Metro User' })
  name?: string;

  static schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(8).required(),
    username: Joi.string().optional().allow('', null),
    name: Joi.string().optional().allow('', null),
  });
}
