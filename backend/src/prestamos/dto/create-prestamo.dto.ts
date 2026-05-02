import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePrestamoDto {
  @IsInt()
  usuario_id: number;

  @IsInt()
  activo_id: number;

  @IsDateString()
  fecha_prestamo: string;

  @IsDateString()
  fecha_devolucion: string;

  @IsOptional()
  @IsString()
  firma_digital?: string;
}
