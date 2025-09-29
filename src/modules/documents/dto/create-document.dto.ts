import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { DocumentCategoryEnum } from '../schemas/document.schema';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DocumentCategoryEnum)
  category: DocumentCategoryEnum;

  @IsString()
  @IsOptional()
  fileId?: string;

  @IsString()
  @IsOptional()
  url?: string;
}
