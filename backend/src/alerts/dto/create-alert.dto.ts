import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName: string;

  @IsIn(['Fake', 'Expired', 'Mislabeled'])
  alertType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
