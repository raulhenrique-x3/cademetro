import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Joi from 'joi';

export class CreateStationDto {
  @ApiProperty({ example: 'Joana Bezerra' })
  name!: string;

  @ApiPropertyOptional({ example: 'JBZ' })
  code?: string | null;

  @ApiProperty({ example: -8.0597 })
  latitude!: number;

  @ApiProperty({ example: -34.8877 })
  longitude!: number;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'Ramal Jaboatão' })
  name!: string;

  @ApiProperty({ example: 'jaboatao' })
  code!: string;

  @ApiProperty({ type: [CreateStationDto] })
  stations!: CreateStationDto[];

  static schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(30).required(),
    stations: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(2).max(100).required(),
          code: Joi.string().min(2).max(10).optional().allow(null, ''),
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
        }),
      )
      .min(2)
      .max(200)
      .required(),
  });
}

export class CreateLineDto {
  @ApiProperty({ example: 'Linha Centro' })
  name!: string;

  @ApiProperty({ example: 'centro' })
  code!: string;

  @ApiProperty({ example: '#1D4ED8' })
  color!: string;

  @ApiProperty({ type: [CreateBranchDto] })
  branches!: CreateBranchDto[];

  static schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    code: Joi.string().min(2).max(30).required(),
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .required(),
    branches: Joi.array()
      .items(CreateBranchDto.schema)
      .min(1)
      .max(8)
      .required(),
  });
}