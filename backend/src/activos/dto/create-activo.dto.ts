import { IsString, IsOptional } from 'class-validator';

export class CreateActivoDto {
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

  @IsOptional()
  @IsString()
  condicion?: string;

  @IsOptional()
  @IsString()
  vigencia?: string;

  @IsOptional()
  @IsString()
  orden_compra?: string;

  @IsOptional()
  empresa_id?: number;
}
