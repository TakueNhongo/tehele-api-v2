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
  Req,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { Public } from '../../decorators/public.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequestWithUser } from 'src/types/requests.type';

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
  @Get('search')
  async searchDocuments(@Query('q') query: string) {
    return this.documentsService.searchDocuments(query);
  }

  @Public()
  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }

  @Get(':id/ai-guidance')
  async getAIGuidance(
    @Param('id') id: string,
    @Query('stage') stage?: string,
    @Req() req?: RequestWithUser,
  ) {
    const profileId = req?.profileId?.toString();
    return this.documentsService.getAIGuidance(id, profileId, stage);
  }

  // Public endpoints for document creation
  @Public()
  @Post()
  async createDocument(@Body() createDto: CreateDocumentDto) {
    return this.documentsService.createDocument(createDto);
  }

  // Test routes for bulk data creation
  @Public()
  @Post('test/bulk-create')
  async createBulkTestData() {
    return this.documentsService.createBulkTestData();
  }

  @Public()
  @Delete('test/clear')
  async clearTestData() {
    return this.documentsService.clearTestData();
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
