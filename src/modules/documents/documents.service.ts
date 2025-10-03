import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { FilesService } from '../files/files.service';
import { StartupService } from '../startup/startup.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private filesService: FilesService,
    private startupService: StartupService,
  ) {}

  // Document CRUD operations
  async createDocument(
    createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    // Validate fileId if provided
    if (createDocumentDto.fileId) {
      await this.validateFileExists(createDocumentDto.fileId);
    }

    const document = new this.documentModel(createDocumentDto);
    return await document.save();
  }

  async getDocuments(filters: DocumentFiltersDto): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
  }> {
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
      this.documentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
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

  async updateDocument(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    // Validate fileId if provided
    if (updateDocumentDto.fileId) {
      await this.validateFileExists(updateDocumentDto.fileId);
    }

    const document = await this.documentModel
      .findByIdAndUpdate(id, updateDocumentDto, { new: true })
      .exec();
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
    return this.documentModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    return this.documentModel
      .find({ category: categoryId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // AI Guidance
  async getAIGuidance(
    documentId: string,
    profileId?: string,
    startupStage?: string,
  ): Promise<{ success: boolean; guidance: string | null; document: any }> {
    // Fetch document and startup data in parallel
    const [document, startupData] = await Promise.all([
      this.getDocumentById(documentId),
      profileId ? this.getStartupByProfileId(profileId) : Promise.resolve(null),
    ]);

    try {
      const geminiApiKey = process.env.GOOGLE_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Google API key not found');
      }

      // Fetch the actual document file content - this is required
      if (!document.fileId) {
        throw new InternalServerErrorException(
          'Document file not found - cannot provide guidance without document content',
        );
      }

      let documentContent;
      try {
        const documentStream = await this.filesService.fetchFile(
          document.fileId,
        );
        const documentBase64 = await this.convertStreamToBase64(
          documentStream.stream,
        );
        documentContent = documentBase64;
      } catch (error) {
        throw new InternalServerErrorException(
          'Document file not found or error fetching',
        );
      }

      const prompt = `
You are a document completion expert. Analyze this document and provide concise, actionable guidance for filling out each section.

${
  startupData
    ? `
STARTUP CONTEXT:
${JSON.stringify(startupData, null, 2)}
`
    : ''
}

Start your response with a brief introduction that acknowledges the startup's specific context and the document's purpose. For example: "Based on your [startup name/industry] profile, here's how to complete this [document type] effectively..."

For each section or field in the document, provide:
1. What information to include
2. How to fill it out properly
3. Common mistakes to avoid
4. Specific examples or tips that are relevant to the startup's industry, stage, and business model

Use the startup's actual data (company name, industry, funding stage, etc.) in your examples to make them more relevant and actionable.

Focus on practical, step-by-step guidance for completing the document. Be concise and direct. Avoid long explanations or summaries.

IMPORTANT: Use markdown formatting for better readability. Include headers, lists, and emphasis where appropriate.
`;

      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: documentContent,
                },
              },
            ],
          },
        ],
        generationConfig: {
          thinkingConfig: {
            thinkingBudget: 128,
          },
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
        console.log('Gemini API response:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.error('Error parsing Gemini API response:', parseError);
        const textResponse = await response.text();
        console.log('Raw text response:', textResponse);
        throw new Error('Failed to parse Gemini API response');
      }

      const guidance = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!guidance) {
        console.error('No guidance in response:', result);
        throw new Error('No guidance returned from Gemini API');
      }

      return {
        success: true,
        guidance: guidance.trim(),
        document: {
          title: document.title,
          category: document.category,
          companyStage: document.companyStage,
        },
      };
    } catch (error) {
      console.error('Error getting AI guidance:', error);
      // Return a proper error response structure
      return {
        success: false,
        guidance: null,
        document: {
          title: document.title,
          category: document.category,
          companyStage: document.companyStage,
        },
      };
    }
  }

  // Helper method to get startup by profile ID
  private async getStartupByProfileId(profileId: string): Promise<any> {
    try {
      const startup = await this.startupService.getStartupById(profileId);
      return startup;
    } catch (error) {
      console.log('Startup not found for profileId:', profileId);
      return null;
    }
  }

  // Helper method to convert GridFS stream to base64
  private async convertStreamToBase64(stream: any): Promise<string> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('base64'));
      });
      stream.on('error', reject);
    });
  }

  // Test method for bulk data creation
  async createBulkTestData(): Promise<{ message: string; count: number }> {
    const testDocuments = [
      // Financials Category
      {
        title: 'Financial Model Template - Seed Stage',
        description:
          'Comprehensive financial model for seed-stage startups with revenue projections, unit economics, and funding requirements.',
        category: 'financials',
        companyStage: 'seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Budget Planning Worksheet - Pre-Seed',
        description:
          'Detailed budget planning template for pre-seed startups to track expenses and plan for growth.',
        category: 'financials',
        companyStage: 'pre_seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Unit Economics Calculator - Series A',
        description:
          'Advanced unit economics calculator for Series A startups to analyze customer acquisition costs and lifetime value.',
        category: 'financials',
        companyStage: 'series_a',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Cash Flow Projection Template',
        description:
          'Monthly cash flow projection template to track burn rate and runway for all startup stages.',
        category: 'financials',
        companyStage: 'idea',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },

      // Legal Category
      {
        title: 'Founder Agreement Template',
        description:
          'Comprehensive founder agreement template covering equity splits, vesting schedules, and decision-making processes.',
        category: 'legal',
        companyStage: 'idea',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Employment Contract Template',
        description:
          'Standard employment contract template for hiring employees and contractors in early-stage startups.',
        category: 'legal',
        companyStage: 'pre_seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Privacy Policy Generator',
        description:
          'Comprehensive privacy policy template compliant with GDPR and CCPA for tech startups.',
        category: 'legal',
        companyStage: 'seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Terms of Service Template',
        description:
          'Standard terms of service template for SaaS and marketplace startups.',
        category: 'legal',
        companyStage: 'series_a',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },

      // Operations Category
      {
        title: 'SOP Template - Customer Support',
        description:
          'Standard operating procedures template for customer support operations and escalation processes.',
        category: 'operations',
        companyStage: 'seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Employee Onboarding Checklist',
        description:
          'Comprehensive employee onboarding checklist to ensure smooth integration of new team members.',
        category: 'operations',
        companyStage: 'pre_seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Product Development Roadmap',
        description:
          'Agile product development roadmap template for planning and tracking feature development.',
        category: 'operations',
        companyStage: 'series_a',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Quality Assurance Checklist',
        description:
          'Comprehensive QA checklist for testing products and features before release.',
        category: 'operations',
        companyStage: 'series_b_plus',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },

      // Pitch Deck Category
      {
        title: 'Pitch Deck Template - Idea Stage',
        description:
          'Professional pitch deck template for idea-stage startups to present to early investors and advisors.',
        category: 'pitch_deck',
        companyStage: 'idea',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Pitch Deck Template - Pre-Seed',
        description:
          'Comprehensive pitch deck template for pre-seed fundraising with market analysis and traction data.',
        category: 'pitch_deck',
        companyStage: 'pre_seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Pitch Deck Template - Seed Stage',
        description:
          'Advanced pitch deck template for seed-stage fundraising with detailed financial projections and growth metrics.',
        category: 'pitch_deck',
        companyStage: 'seed',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Pitch Deck Template - Series A',
        description:
          'Professional pitch deck template for Series A fundraising with comprehensive business metrics and expansion plans.',
        category: 'pitch_deck',
        companyStage: 'series_a',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
      {
        title: 'Pitch Deck Template - Series B+',
        description:
          'Enterprise-grade pitch deck template for Series B and beyond with detailed market analysis and scaling strategies.',
        category: 'pitch_deck',
        companyStage: 'series_b_plus',
        fileId: '68de4d08267797560d6b931b',
        coverImageId: '68e007a3ecdae0e6d2f28870',
      },
    ];

    try {
      // Clear existing test data first
      await this.documentModel.deleteMany({
        fileId: '68de4d08267797560d6b931b',
      });

      // Create new test documents
      const createdDocuments =
        await this.documentModel.insertMany(testDocuments);

      return {
        message: 'Bulk test data created successfully',
        count: createdDocuments.length,
      };
    } catch (error) {
      console.error('Error creating bulk test data:', error);
      throw new BadRequestException('Failed to create bulk test data');
    }
  }

  // Test method for clearing test data
  async clearTestData(): Promise<{ message: string; count: number }> {
    try {
      const result = await this.documentModel.deleteMany({
        fileId: '68de4d08267797560d6b931b',
      });

      return {
        message: 'Test data cleared successfully',
        count: result.deletedCount,
      };
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw new BadRequestException('Failed to clear test data');
    }
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
