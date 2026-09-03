import { ApiProperty } from '@nestjs/swagger';
import Joi from 'joi';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 's3cret!P' })
  password!: string;

  static schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required(),
  });
}
