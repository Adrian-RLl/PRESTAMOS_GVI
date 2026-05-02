import { IsString, IsOptional } from 'class-validator';

export class CreateActivoDto {
  @IsString()
  codigo_patrimonial: string;

  @IsString()
  tipo: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsString()
  serie: string;

  @IsString()
  estado: string;

  @IsString()
  ubicacion: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
