import { IsInt, IsString, IsDateString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreatePrestamoDto {
  @IsInt()
  usuario_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  activos_ids: number[];

  @IsDateString()
  fecha_prestamo: string;

  @IsDateString()
  fecha_devolucion: string;

  @IsOptional()
  @IsString()
  firma_digital?: string;
}
