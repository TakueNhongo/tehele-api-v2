import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { DocumentCategoryEnum, CompanyStage } from '../schemas/document.schema';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DocumentCategoryEnum)
  category: DocumentCategoryEnum;

  @IsEnum(CompanyStage)
  companyStage: CompanyStage;

  @IsString()
  @IsOptional()
  fileId?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  coverImageId?: string;
}
