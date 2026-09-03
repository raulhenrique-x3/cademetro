import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DirectionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Jaboatão' })
  name!: string;

  @ApiProperty({ example: 'JAB' })
  code!: string;
}

export class LineStationDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Jaboatão' })
  name!: string;

  @ApiPropertyOptional({ example: 'JAB' })
  code?: string | null;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ example: -8.0245 })
  latitude!: number;

  @ApiProperty({ example: -34.9710 })
  longitude!: number;
}

export class BranchDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ramal Jaboatão' })
  name!: string;

  @ApiProperty({ example: 'jaboatao' })
  code!: string;

  @ApiProperty({ example: 0 })
  order!: number;
}

export class BranchDetailDto extends BranchDto {
  @ApiProperty({ type: [LineStationDto] })
  stations!: LineStationDto[];
}

export class LineDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Linha Centro' })
  name!: string;

  @ApiProperty({ example: 'centro' })
  code!: string;

  @ApiProperty({ example: '#1D4ED8' })
  color!: string;

  @ApiProperty({ type: [DirectionDto] })
  directions!: DirectionDto[];
}

export class LineDetailDto extends LineDto {
  @ApiProperty({ type: [BranchDetailDto] })
  branches!: BranchDetailDto[];
}