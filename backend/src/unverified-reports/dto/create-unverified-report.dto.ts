import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateUnverifiedReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  purchaseLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
