import { IsOptional, IsString, IsEnum } from 'class-validator';
import { DocumentCategoryEnum, CompanyStage } from '../schemas/document.schema';

export class DocumentFiltersDto {
  @IsOptional()
  @IsEnum(DocumentCategoryEnum)
  category?: DocumentCategoryEnum;

  @IsOptional()
  @IsEnum(CompanyStage)
  companyStage?: CompanyStage;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
