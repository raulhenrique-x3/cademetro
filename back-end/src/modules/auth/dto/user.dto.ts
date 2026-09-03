import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'metro_user' })
  username?: string | null;

  @ApiPropertyOptional({ example: 'Metro User' })
  name?: string | null;

  @ApiProperty({ example: 'USER', enum: ['USER', 'MODERATOR', 'ADMIN'] })
  role!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'SUSPENDED'] })
  status!: string;

  @ApiProperty({ example: 0.5 })
  trustScore!: number;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt!: string;
}

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;

  @ApiProperty({ example: 'dGhpcy1pcy1hLXJlZnJlc2gtdG9rZW4uLi4' })
  refreshToken!: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Account created successfully' })
  message!: string;
}
