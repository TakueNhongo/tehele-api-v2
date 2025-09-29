import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentDocument } from './schemas/document.schema';
import { DocumentCategory, DocumentCategoryDocument } from './schemas/document-category.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilesService } from '../files/files.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    @InjectModel(DocumentCategory.name) private categoryModel: Model<DocumentCategoryDocument>,
    private filesService: FilesService,
  ) {}

  // Document CRUD operations
  async createDocument(createDocumentDto: CreateDocumentDto): Promise<Document> {
    // Validate fileId if provided
    if (createDocumentDto.fileId) {
      await this.validateFileExists(createDocumentDto.fileId);
    }

    const document = new this.documentModel(createDocumentDto);
    return await document.save();
  }

  async getDocuments(filters: DocumentFiltersDto): Promise<{ documents: Document[]; total: number; page: number; limit: number }> {
    const { category, search, page = '1', limit = '10' } = filters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [documents, total] = await Promise.all([
      this.documentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).exec(),
      this.documentModel.countDocuments(query).exec(),
    ]);

    return {
      documents,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async getDocumentById(id: string): Promise<Document> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    // Validate fileId if provided
    if (updateDocumentDto.fileId) {
      await this.validateFileExists(updateDocumentDto.fileId);
    }

    const document = await this.documentModel.findByIdAndUpdate(id, updateDocumentDto, { new: true }).exec();
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    const result = await this.documentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Document not found');
    }
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return this.documentModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 }).exec();
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    return this.documentModel.find({ category: categoryId }).sort({ createdAt: -1 }).exec();
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.documentModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();
  }

  // Category management
  async getCategories(): Promise<DocumentCategory[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<DocumentCategory> {
    const category = new this.categoryModel(createCategoryDto);
    return await category.save();
  }

  private async validateFileExists(fileId: string): Promise<string> {
    try {
      await this.filesService.getFileInfo(fileId);
      return fileId;
    } catch (error) {
      throw new BadRequestException('Invalid file ID provided');
    }
  }
}
