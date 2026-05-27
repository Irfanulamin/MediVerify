import { IsString, IsBoolean, IsNumber, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateMedicineDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  genericName?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  uses?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sideEffects?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fakeIndicators?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  safeAlternatives?: string[];

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  requiresPrescription?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
