import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public } from '../../decorators/public.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Public endpoints
  @Public()
  @Get()
  async getDocuments(@Query() filters: DocumentFiltersDto) {
    return this.documentsService.getDocuments(filters);
  }

  @Public()
  @Get('categories')
  async getCategories() {
    return this.documentsService.getCategories();
  }

  @Public()
  @Get('search')
  async searchDocuments(@Query('q') query: string) {
    return this.documentsService.searchDocuments(query);
  }

  @Public()
  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }

  @Public()
  @Get(':id/view')
  async viewDocument(@Param('id') id: string) {
    await this.documentsService.incrementViewCount(id);
    return this.documentsService.getDocumentById(id);
  }

  // Public endpoints for document and category creation
  @Public()
  @Post()
  async createDocument(@Body() createDto: CreateDocumentDto) {
    return this.documentsService.createDocument(createDto);
  }

  @Public()
  @Post('categories')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.documentsService.createCategory(createCategoryDto);
  }

  // Admin endpoints (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id);
    return { message: 'Document deleted successfully' };
  }
}
