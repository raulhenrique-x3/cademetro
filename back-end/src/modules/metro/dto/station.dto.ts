import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StationLineInfoDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Linha 1–Azul' })
  name!: string;

  @ApiProperty({ example: '1-azul' })
  code!: string;

  @ApiProperty({ example: '#1D4ED8' })
  color!: string;
}

export class StationDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Jabaquara' })
  name!: string;

  @ApiPropertyOptional({ example: 'L1-S01' })
  code?: string | null;

  @ApiProperty({ example: -23.6454 })
  latitude!: number;

  @ApiProperty({ example: -46.6342 })
  longitude!: number;

  @ApiProperty({ type: [StationLineInfoDto] })
  lines!: StationLineInfoDto[];
}
