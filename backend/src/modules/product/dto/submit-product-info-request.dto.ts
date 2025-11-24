import { IsString, Length } from 'class-validator';

export class SubmitProductInfoRequestDto {
  @IsString()
  @Length(3, 100, {
    message: 'Product name must be between 3 and 100 characters',
  })
  productName!: string;

  @IsString()
  @Length(1, 250, {
    message: 'Product description must be between 1 and 250 characters',
  })
  productDescription!: string;
}
