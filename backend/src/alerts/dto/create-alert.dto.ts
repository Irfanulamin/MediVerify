import { IsString, IsIn, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ALERT_TYPES } from '../alert.schema';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName: string;

  @IsIn(ALERT_TYPES as unknown as string[])
  alertType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pharmacyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;
}
