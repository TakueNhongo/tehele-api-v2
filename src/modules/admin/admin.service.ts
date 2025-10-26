import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Investor,
  InvestorDocument,
} from '../investor/schemas/investor.schema';
import { Startup, StartupDocument } from '../startup/schemas/startup.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { PerformanceHistoryStatusEnum } from '../startup/enums/startup.enums';
import { NotificationService } from '../notification/notification.service';
import { NotificationSeverityEnum } from '../notification/schemas/notification.schema';
import {
  Investment,
  InvestmentDocument,
} from '../investment/schemas/investment.schema';
import { FilesService } from '../files/files.service';
import {
  StartupDDCache,
  StartupDDCacheDocument,
} from './schemas/startup-dd-cache.schema';
import {
  InvestorDDCache,
  InvestorDDCacheDocument,
} from './schemas/investor-dd-cache.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    @InjectModel(Startup.name) private startupModel: Model<StartupDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(StartupDDCache.name)
    private startupDDCacheModel: Model<StartupDDCacheDocument>,
    @InjectModel(InvestorDDCache.name)
    private investorDDCacheModel: Model<InvestorDDCacheDocument>,
    private readonly notificationService: NotificationService,
    private readonly filesService: FilesService,
  ) {}

  async getDashboardStats() {
    const [
      totalInvestors,
      totalStartups,
      pendingInvestorVerifications,
      pendingStartupVerifications,
      upcomingEvents,
    ] = await Promise.all([
      this.investorModel.countDocuments(),
      this.startupModel.countDocuments(),
      this.investorModel.countDocuments({
        isVerified: false,
        isRejected: false,
      }),
      this.startupModel.countDocuments({
        isVerified: false,
        isRejected: false,
      }),
      this.eventModel.countDocuments({ startDate: { $gte: new Date() } }),
    ]);

    //         pendingInvestorVerifications +

    return {
      investors: totalInvestors,
      startups: totalStartups,
      pendingVerifications: pendingStartupVerifications,
      upcomingEvents,
    };
  }

  async getStartupsWithPendingPerformanceChanges(): Promise<StartupDocument[]> {
    const results = await this.startupModel
      .find({
        performanceHistoryStatus: PerformanceHistoryStatusEnum.IN_REVIEW,
      })
      .populate('createdBy');

    return results;
  }

  async getAllInvestors() {
    return this.investorModel.find().populate('createdBy');
  }

  async getInvestorById(id: string) {
    const investor = await this.investorModel
      .findById(id)
      .populate('createdBy');
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }

  async verifyInvestor(id: string) {
    const updatedInvestor = await this.investorModel
      .findByIdAndUpdate(
        id,
        { isVerified: true, isRejected: false },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedInvestor) throw new NotFoundException('Investor not found');

    // Create notification for investor verification
    await this.notificationService.createNotification(
      null, // no startupId
      updatedInvestor._id,
      'Your investor profile has been verified successfully!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedInvestor;
  }

  async rejectInvestor(id: string) {
    const updatedInvestor = await this.investorModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, isRejected: true },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedInvestor) throw new NotFoundException('Investor not found');

    // Create notification for investor rejection
    await this.notificationService.createNotification(
      null, // no startupId
      updatedInvestor._id,
      'Your investor profile verification has been rejected. Please update your information and try again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedInvestor;
  }

  async getAllStartups() {
    return this.startupModel.find().populate('createdBy team');
  }

  async getStartupById(id: string) {
    const startup = await this.startupModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('team', 'name role bio email isCreator isActive');
    if (!startup) throw new NotFoundException('Startup not found');
    return startup;
  }

  async verifyStartup(id: string) {
    const updatedStartup = await this.startupModel
      .findByIdAndUpdate(
        id,
        { businessVerified: true, isRejected: false },
        { new: true },
      )
      .populate('createdBy', 'firstName lastName email')
      .populate('team', 'name role bio email isCreator isActive');

    if (!updatedStartup) throw new NotFoundException('Startup not found');

    // Create notification for startup verification
    await this.notificationService.createNotification(
      updatedStartup._id,
      null, // no investorId
      'Your startup profile has been verified successfully!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedStartup;
  }

  async approveStartupPerformanceChanges(
    startupId: string,
  ): Promise<StartupDocument> {
    const startup = await this.startupModel.findById(startupId);
    if (!startup) {
      throw new NotFoundException('Startup not found');
    }
    startup.performanceHistoryStatus = PerformanceHistoryStatusEnum.ACCEPTED;
    await startup.save();

    // Create notification for performance changes approval
    await this.notificationService.createNotification(
      startup._id,
      null, // no investorId
      'Your performance changes have been approved and updated successfully.',
      NotificationSeverityEnum.SUCCESS,
    );

    return startup;
  }

  async rejectAllPerformanceChanges(
    startupId: string,
  ): Promise<StartupDocument> {
    const startup = await this.startupModel.findById(startupId);
    if (!startup) {
      throw new NotFoundException('Startup not found');
    }

    startup.performanceHistoryStatus = PerformanceHistoryStatusEnum.REJECTED;
    await startup.save();

    // Create notification for performance changes rejection
    await this.notificationService.createNotification(
      startup._id,
      null, // no investorId
      'Your performance changes have been rejected. Please review and submit again.',
      NotificationSeverityEnum.ERROR,
    );

    return startup;
  }

  async rejectStartup(id: string) {
    const updatedStartup = await this.startupModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, isRejected: true },
        { new: true },
      )
      .populate('createdBy');

    if (!updatedStartup) throw new NotFoundException('Startup not found');

    // Create notification for startup rejection
    await this.notificationService.createNotification(
      updatedStartup._id,
      null, // no investorId
      'Your startup profile verification has been rejected. Please update your information and try again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedStartup;
  }

  async createAdmin(createAdminDto: any): Promise<UserDocument> {
    const admin = new this.userModel({
      ...createAdminDto,
      isAdmin: true, // Ensure the user is marked as admin
    });
    return admin.save();
  }

  async getAllAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ isAdmin: true }).exec();
  }

  async getAdminById(id: string): Promise<UserDocument> {
    const admin = await this.userModel
      .findOne({ _id: id, isAdmin: true })
      .exec();
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found`);
    }
    return admin;
  }

  async deleteAdmin(id: string): Promise<{ message: string }> {
    const admin = await this.userModel
      .findOneAndDelete({ _id: id, isAdmin: true })
      .exec();
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found`);
    }
    return { message: 'Admin deleted successfully' };
  }

  // Investment Management Methods
  async getAllInvestments() {
    return this.investmentModel
      .find()
      .populate({
        path: 'investorId',
        populate: {
          path: 'createdBy',
        },
      })
      .populate('startupId')
      .exec();
  }

  async getInvestmentById(id: string) {
    const investment = await this.investmentModel
      .findById(id)
      .populate('investorId')
      .populate('startupId')
      .exec();
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  async verifyInvestment(id: string) {
    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        { isVerified: true, status: 'approved' },
        { new: true },
      )
      .populate('investorId')
      .populate('startupId')
      .exec();

    if (!updatedInvestment) throw new NotFoundException('Investment not found');

    // Create notification for investment verification
    await this.notificationService.createNotification(
      updatedInvestment.startupId,
      updatedInvestment.investorId,
      'Your investment has been verified and approved!',
      NotificationSeverityEnum.SUCCESS,
    );

    return updatedInvestment;
  }

  async rejectInvestment(id: string) {
    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        { isVerified: false, status: 'rejected' },
        { new: true },
      )
      .populate('investorId')
      .populate('startupId')
      .exec();

    if (!updatedInvestment) throw new NotFoundException('Investment not found');

    // Create notification for investment rejection
    await this.notificationService.createNotification(
      updatedInvestment.startupId,
      updatedInvestment.investorId,
      'Your investment has been rejected. Please review and submit again.',
      NotificationSeverityEnum.ERROR,
    );

    return updatedInvestment;
  }

  async getPendingInvestments() {
    return this.investmentModel
      .find({ status: 'pending' })
      .populate('investorId')
      .populate('startupId')
      .exec();
  }

  async getVerifiedInvestments() {
    return this.investmentModel
      .find({ isVerified: true })
      .populate('investorId')
      .populate('startupId')
      .exec();
  }

  async createInvestment(createInvestmentDto: any) {
    try {
      const result = await this.investmentModel.create({
        ...createInvestmentDto,
        investorId: new Types.ObjectId(
          createInvestmentDto.investorId as string,
        ),
        startupId: new Types.ObjectId(createInvestmentDto.startupId as string),
      });
      return result;
    } catch (e) {
      console.log(e.message);
      throw new InternalServerErrorException(e);
    }
  }

  // Helper method to convert stream to base64
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

  // Helper method to analyze pitch deck with Gemini
  private async analyzePitchDeckWithGemini(
    pitchDeckBase64: string,
    startupData: any,
  ) {
    try {
      const geminiApiKey = process.env.GOOGLE_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Google API key not found');
      }

      const prompt = `
Analyze this startup pitch deck for DUE DILIGENCE purposes and provide a comprehensive assessment:

1. **Document Authenticity**: Check if this appears to be a legitimate pitch deck (not a template or unrelated document)
2. **Relevance Check**: CRITICAL - Compare the pitch deck content with the startup profile data. Assess if the pitch deck accurately represents this specific startup's:
   - Company name and description
   - Industry and business model
   - Team members and roles
   - Market focus and target customers
   - Financial data and metrics
   - Stage and funding requirements

3. **Relevance Score**: Provide a relevance score (0-100) indicating how well the pitch deck matches the startup profile

4. **Content Quality Analysis**:
   - Completeness: What key sections are present/missing (problem, solution, market, traction, team, financials, ask)
   - Professional quality of presentation
   - Clarity of value proposition
   - Market analysis depth
   - Financial projections quality
   - Team credentials presentation

5. **Red Flags**: Any concerning elements (unrealistic projections, missing critical info, inconsistencies)

6. **Strengths**: What the pitch deck does well

7. **Key Metrics**: Important numbers and data points mentioned

8. **Registration/Legal Information**: Any company registration details, legal entity information visible in the deck

STARTUP PROFILE DATA:
${JSON.stringify(startupData, null, 2)}

IMPORTANT: If the pitch deck is not relevant to this startup profile, clearly state the mismatch. The pitch deck must accurately represent this specific startup's business, team, and goals.

Provide a detailed analysis for due diligence assessment.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: pitchDeckBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysis) {
        throw new Error('No analysis returned from Gemini');
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing pitch deck with Gemini:', error.message);
      return 'Unable to analyze pitch deck: ' + error.message;
    }
  }

  // Helper method to analyze due diligence documents
  private async analyzeDueDiligenceDocument(
    documentBase64: string,
    documentName: string,
    startupData: any,
  ) {
    try {
      const geminiApiKey = process.env.GOOGLE_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Google API key not found');
      }

      const prompt = `
Analyze this due diligence document for authenticity and relevance:

Document name: ${documentName}

1. **Document Type Identification**: What type of document is this (company registration, financial statement, legal agreement, etc.)?

2. **Authenticity Assessment**: Does this appear to be an authentic official document?
   - Look for official stamps, signatures, registration numbers
   - Check for signs of tampering or manipulation
   - Assess professional formatting and structure

3. **Content Verification**: 
   - Company name mentioned
   - Registration numbers or official identifiers
   - Dates and validity periods
   - Key details (jurisdiction, founding date, registered address, directors/owners)

4. **Consistency Check**: Does the information match the startup profile?
   - Company name: ${startupData.companyName}
   - Country: ${startupData.country}
   - Founding year: ${startupData.foundingYear}
  
5. **Red Flags**: Any concerning elements (missing information, inconsistencies, signs of forgery)

6. **Extracted Key Information**: List all important details found in the document

Provide a detailed assessment for due diligence purposes.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: documentBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysis) {
        throw new Error('No analysis returned from Gemini');
      }

      return { documentName, analysis };
    } catch (error) {
      console.error(
        'Error analyzing due diligence document with Gemini:',
        error.message,
      );
      return {
        documentName,
        analysis: 'Unable to analyze document: ' + error.message,
      };
    }
  }

  async generateStartupDueDiligence(startupId: string) {
    try {
      // Check cache first
      const cachedReport = await this.startupDDCacheModel.findOne({
        startupId: new Types.ObjectId(startupId),
        expiresAt: { $gt: new Date() },
      });

      if (cachedReport) {
        console.log('Returning cached startup DD report');
        const report = cachedReport as any;
        return {
          startupId: cachedReport.startupId.toString(),
          startupName: cachedReport.startupName,
          generatedAt: report.updatedAt || report.createdAt || new Date(),
          analysis: cachedReport.analysis,
          documentAnalyses: cachedReport.documentAnalyses,
          cached: true,
        };
      }

      const startup = await this.startupModel
        .findById(startupId)
        .populate('createdBy', 'firstName lastName email')
        .populate('team', 'name role bio email linkedin')
        .lean();

      if (!startup) {
        throw new NotFoundException('Startup not found');
      }

      // Step 1: Analyze pitch deck if available
      let pitchDeckAnalysis = null;
      if (startup.pitchDeckFileId) {
        try {
          const pitchDeckStream = await this.filesService.fetchFile(
            startup.pitchDeckFileId,
          );
          const pitchDeckBase64 = await this.convertStreamToBase64(
            pitchDeckStream.stream,
          );

          pitchDeckAnalysis = await this.analyzePitchDeckWithGemini(
            pitchDeckBase64,
            startup,
          );
          console.log('Pitch deck analyzed successfully');
        } catch (error) {
          console.log(
            'Pitch deck not found or error analyzing:',
            error.message,
          );
          pitchDeckAnalysis = 'No pitch deck available or error analyzing';
        }
      }

      // Step 2: Analyze due diligence documents if available
      const dueDiligenceDocAnalyses = [];
      if (
        startup.dueDiligenceFileIds &&
        startup.dueDiligenceFileIds.length > 0
      ) {
        for (let i = 0; i < startup.dueDiligenceFileIds.length; i++) {
          const fileId = startup.dueDiligenceFileIds[i];
          try {
            const docStream = await this.filesService.fetchFile(fileId);
            const docBase64 = await this.convertStreamToBase64(
              docStream.stream,
            );

            const analysis = await this.analyzeDueDiligenceDocument(
              docBase64,
              `Document ${i + 1}`,
              startup,
            );
            dueDiligenceDocAnalyses.push(analysis);
            console.log(
              `Due diligence document ${i + 1} analyzed successfully`,
            );
          } catch (error) {
            console.log(
              `Error analyzing due diligence document ${i + 1}:`,
              error.message,
            );
            dueDiligenceDocAnalyses.push({
              documentName: `Document ${i + 1}`,
              analysis: 'Unable to analyze document',
            });
          }
        }
      }

      // Step 3: Generate comprehensive DD report with document analysis
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are a senior venture capital analyst at Tehele Ventures. Your task is to perform comprehensive due diligence on a startup application.

TEHELE VENTURES STAGE CLASSIFICATION FRAMEWORK:

1. 🌱 PRE-SEED STAGE
Management & Governance:
- Strong: Founders with prior startup/industry experience, even if no formal governance
- Average: First-time founders with some advisory support
- Weak: No relevant experience, no clear ownership alignment, governance nonexistent

Business/Industry Risk:
- Strong: Clear problem definition in a large/growing market
- Average: Competitive differentiation exists but not obvious or easily replicable
- Weak: Problem not well defined; unclear if it is a "must solve" issue

Leverage/Liquidity/Coverage/Cash Flow:
- Not meaningful at this stage. Companies run on founder cash, accelerators, angels
- Risk assessment leans on runway (months of cash) and founder commitment

2. 🌱 SEED STAGE
Management & Governance:
- Strong: Founders building a credible team, some independent advisors, early board structures
- Average: Strong founders but no governance beyond day-to-day
- Weak: Team churn, unclear equity splits, or misaligned incentives

Business/Industry Risk:
- Strong: Differentiated MVP in a validated, growing market
- Average: MVP works but crowded/uncertain market
- Weak: MVP with no clear competitive edge

Leverage: Mostly equity-funded. Strong = no or very limited debt
Liquidity: Strong = >12 months runway; Average = 6-12 months; Weak = <6 months
Cash Flow: Still negative. Risk assessed via burn multiple (cash burn relative to revenue growth)

3. 🚀 SERIES A
Management & Governance:
- Strong: Experienced execs added, formalized board, independent governance
- Average: Founder-led, minimal governance but functional
- Weak: Leadership gaps, lack of accountability

Business/Industry Risk:
- Strong: Proven PMF, sticky users, high switching costs
- Average: Traction but in fragmented or competitive market
- Weak: User growth stalling or churn high

Leverage: Mostly still equity-funded. Strong = disciplined financing. Weak = heavy reliance on venture debt without revenue scale
Liquidity: Strong = >18 months runway post-raise
Coverage & Cash Flow: Revenue starting but FCF often negative. Strong signals = high gross margins, clear path to breakeven

4. 📈 SERIES B AND BEYOND
Management & Governance:
- Strong: Scaled leadership, CFO/COO in place, independent board, professional reporting
- Average: Still founder-centric with partial institutionalization
- Weak: Operational scaling struggles, governance gaps

Business/Industry Risk:
- Strong: Proven business model, diversified customers, competitive moat
- Average: Revenue growing but high concentration
- Weak: Dependence on one product/region, industry cyclicality

Leverage: Venture/growth debt more common. Strong = modest leverage with equity cushion. Weak = over-levered relative to cash flow
Liquidity: Strong = multiple capital access routes (VC, venture debt, strategic)
Coverage & Cash Flow: Strong = improving FCF, healthy unit economics. Weak = scaling revenue but burning cash inefficiently

STARTUP DATA:
${JSON.stringify(startup, null, 2)}

${
  pitchDeckAnalysis
    ? `
PITCH DECK ANALYSIS (by Gemini):
${pitchDeckAnalysis}
`
    : `
PITCH DECK: Not available or could not be analyzed
`
}

${
  dueDiligenceDocAnalyses.length > 0
    ? `
DUE DILIGENCE DOCUMENTS ANALYSIS (by Gemini):
${dueDiligenceDocAnalyses.map((doc) => `\n--- ${doc.documentName} ---\n${doc.analysis}`).join('\n\n')}
`
    : `
DUE DILIGENCE DOCUMENTS: No documents uploaded or could not be analyzed
`
}

ANALYSIS TASKS:

1. Classify the startup's TRUE stage based on Tehele's framework (Pre-Seed, Seed, Series A, or Series B+)
2. Compare with their self-reported stage and flag discrepancies
3. Score each dimension: Management & Governance, Business/Industry Risk, Leverage, Liquidity, Cash Flow
4. Answer the following due diligence questions based on available data (skip question 14 about cap table):

Questions to answer:
1. What problems are you solving, and how big is the market opportunity?
2. What is your unique value proposition or solution?
3. Who are your target customers, and what evidence do you have of customer interest or demand?
4. What is your business model and how do you plan to make money?
5. What progress have you made so far?
6. Who is on your founding team, and what relevant experience do they bring?
7. What is your current cash runway, and how much capital have you raised so far?
8. What are your funding needs and planned use of capital?
9. What key milestones do you aim to achieve before the next funding round?
10. What is your current equity structure and capitalization table? (SKIP THIS - say "Not available in current data")
11. What competitive landscape do you face, and what are your barriers to entry?
12. How do you plan to acquire and retain customers?
13. What intellectual property do you own or plan to secure?
14. What regulatory or legal challenges could impact your business?
15. What is your pricing strategy and how have you validated it?
16. What is your expected timeline to profitability or positive cash flow?
17. Who are your key partners or advisors?
18. What are your biggest risks and challenges, and how do you plan to mitigate them?
19. What metrics or KPIs are you tracking to measure progress?
20. What is your exit strategy or long-term vision?

Respond with VALID JSON matching this exact schema:
{
  "stageAnalysis": {
    "selfReportedStage": "string - what they claimed",
    "teheleClassifiedStage": "string - Pre-Seed, Seed, Series A, or Series B+",
    "confidence": number (0-100),
    "discrepancyFlag": boolean,
    "reasoning": "string - detailed explanation of why this stage was assigned"
  },
  "dimensionScores": {
    "managementGovernance": {
      "score": "Strong | Average | Weak",
      "details": "string - specific assessment",
      "keyFactors": ["array of key observations"]
    },
    "businessRisk": {
      "score": "Strong | Average | Weak",
      "details": "string - specific assessment",
      "keyFactors": ["array of key observations"]
    },
    "leverage": {
      "score": "Strong | Average | Weak | Not Applicable",
      "details": "string - specific assessment"
    },
    "liquidity": {
      "score": "Strong | Average | Weak",
      "runwayMonths": number or null,
      "details": "string - specific assessment"
    },
    "cashFlow": {
      "score": "Strong | Average | Weak | Not Applicable",
      "details": "string - specific assessment"
    }
  },
  "dueDiligenceQuestions": [
    {
      "questionNumber": number,
      "question": "string - the question",
      "answer": "string - detailed answer based on data",
      "confidence": "High | Medium | Low | Insufficient Data",
      "dataGaps": "string - what's missing if confidence is not High"
    }
  ],
  "overallAssessment": {
    "investmentReadiness": "Ready | Almost Ready | Not Ready",
    "overallScore": number (0-100),
    "keyStrengths": ["array of 3-5 strengths"],
    "criticalWeaknesses": ["array of 3-5 weaknesses"],
    "redFlags": ["array of any serious red flags"],
    "recommendations": ["array of 3-5 actionable recommendations for Tehele team"]
  }
}

IMPORTANT:
- Be objective and data-driven
- Flag missing critical information
- Don't be overly optimistic - Tehele needs honest assessment
- If data is insufficient for a question, explicitly state what's missing
- For financial calculations (runway, burn rate), use the financialHistory array if available
- USE THE PITCH DECK ANALYSIS to inform your assessment of presentation quality, team strength, and business model
- USE THE DUE DILIGENCE DOCUMENTS ANALYSIS to assess legal compliance, document authenticity, and verify company information
- If documents show inconsistencies with profile data, FLAG THIS as a critical red flag
- If documents appear inauthentic or tampered, this should heavily impact the overall assessment
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior venture capital due diligence analyst. You provide thorough, objective assessments based on data. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        // temperature: 0.3,
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      const documentAnalyses = {
        pitchDeck: pitchDeckAnalysis || 'Not available',
        dueDiligenceDocuments: dueDiligenceDocAnalyses,
      };

      // Cache the report for 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.startupDDCacheModel.findOneAndUpdate(
        { startupId: new Types.ObjectId(startupId) },
        {
          startupId: new Types.ObjectId(startupId),
          startupName: startup.companyName,
          analysis,
          documentAnalyses,
          expiresAt,
        },
        { upsert: true, new: true },
      );

      console.log('Startup DD report cached successfully');

      return {
        startupId,
        startupName: startup.companyName,
        generatedAt: new Date(),
        analysis,
        documentAnalyses,
        cached: false,
      };
    } catch (error) {
      console.error('Error generating startup due diligence:', error);
      throw new InternalServerErrorException(
        'Failed to generate due diligence report',
      );
    }
  }

  async generateInvestorDueDiligence(investorId: string) {
    try {
      // Check cache first
      const cachedReport = await this.investorDDCacheModel.findOne({
        investorId: new Types.ObjectId(investorId),
        expiresAt: { $gt: new Date() },
      });

      if (cachedReport) {
        const report = cachedReport as any;
        return {
          investorId: cachedReport.investorId.toString(),
          investorName: cachedReport.investorName,
          generatedAt: report.updatedAt || report.createdAt || new Date(),
          analysis: cachedReport.analysis,
          cached: true,
        };
      }

      const investor = await this.investorModel
        .findById(investorId)
        .populate('createdBy', 'firstName lastName email')
        .lean();

      if (!investor) {
        throw new NotFoundException('Investor not found');
      }

      // Generate comprehensive investor profiling with OpenAI
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are a senior venture capital analyst at Tehele Ventures. Your task is to perform comprehensive due diligence and profiling on an investor.

TEHELE VENTURES INVESTOR CLASSIFICATION FRAMEWORK:

STRONG INVESTOR CHARACTERISTICS BY STAGE:

Idea Stage:
- Believes in the founder early, even without traction
- Provides hands-on support: brainstorming, pitch prep, first hires
- Okay with high risk and no immediate return

Pre-Seed:
- Believes deeply in the founder's vision before product or traction exists
- Offers hands-on support: strategy, network introductions, recruiting help
- Patient with uncertainty and high risk, focused on long-term potential

Seed:
- Helps build the company's foundation (product market fit)
- Introduces early hires, advisors, or co-investors
- Clear about terms, flexible during early stumbles

Series A:
- Brings structure: helps with board setup, metrics, growth plans
- Follows on with capital or helps bring in top-tier leads
- Guides founders through real scale challenges

Series B+:
- Supports professionalizing the company: ops, finance, legal
- Focuses on sustainable growth and next-round prep (Series C, exit)
- Brings real networks: late-stage investors, M&A, IPO paths

AVERAGE INVESTOR CHARACTERISTICS BY STAGE:

Idea Stage:
- Interested, but needs traction or a co-lead to commit
- Offers some advice, but mostly takes a wait-and-see approach
- Rarely leads — follows better-known angels or funds

Pre-Seed:
- Interested but cautious; waits for some traction or co-investors
- Offers occasional advice but limited active support
- Participates in rounds but rarely leads

Seed:
- Joins rounds but isn't deeply involved post-investment
- Helpful when asked, but not proactive
- Standard terms — not great, not bad

Series A:
- Offers value if aligned with the sector
- May be more hands-off unless the company is clearly doing well
- Helpful with intros, but not strategic leadership

Series B+:
- Interested in momentum but not built for later-stage scaling
- Likely to follow rather than lead or anchor a large round
- Limited value beyond capital

WEAK INVESTOR CHARACTERISTICS BY STAGE:

Idea Stage:
- Over-focuses on ownership or control too early
- Pushes for unfair terms (e.g. high discounts, heavy prefs)
- Disappears after the check is written

Pre-Seed:
- Pushes for aggressive ownership or control very early
- Rarely adds value beyond money
- Disengages after the check is made

Seed:
- Offers little help beyond the money
- May become a blocker in future rounds (slow responses, misaligned goals)
- Seen as difficult by other investors or founders

Series A:
- Lacks the network or experience to support scaling
- May push for short-term outcomes or exits
- Can slow down decisions or cause board misalignment

Series B+:
- Not suited for growth-stage — adds no strategic value
- Poor understanding of scaling operations or capital efficiency
- Can hurt reputation during later-stage due diligence

INVESTOR DATA:
${JSON.stringify(investor, null, 2)}

ANALYSIS TASKS:

1. Classify the investor as Strong, Average, or Weak for EACH stage (Idea, Pre-Seed, Seed, Series A, Series B+)
2. Determine their overall investor profile and type
3. Assess their risk appetite and investment approach
4. Identify their value-add potential beyond capital
5. Flag any concerns or red flags based on their profile data

Respond with VALID JSON matching this exact schema:
{
  "stageClassifications": {
    "idea": {
      "classification": "Strong | Average | Weak",
      "reasoning": "string - specific reasoning based on framework",
      "fitScore": number (0-100)
    },
    "preSeed": {
      "classification": "Strong | Average | Weak",
      "reasoning": "string - specific reasoning based on framework",
      "fitScore": number (0-100)
    },
    "seed": {
      "classification": "Strong | Average | Weak",
      "reasoning": "string - specific reasoning based on framework",
      "fitScore": number (0-100)
    },
    "seriesA": {
      "classification": "Strong | Average | Weak",
      "reasoning": "string - specific reasoning based on framework",
      "fitScore": number (0-100)
    },
    "seriesBPlus": {
      "classification": "Strong | Average | Weak",
      "reasoning": "string - specific reasoning based on framework",
      "fitScore": number (0-100)
    }
  },
  "investorProfile": {
    "investorType": "string - classify as: Hands-on Angel, Passive Angel, Micro VC, Institutional VC, Corporate Investor, Family Office, etc.",
    "primaryStagesFocus": ["array of stages where they are most effective"],
    "capitalDepth": "High | Medium | Low - relative to their stated preferences",
    "riskAppetite": "High | Medium | Low",
    "involvementLevel": "Very Active | Active | Moderate | Passive",
    "expectedValueAdd": ["array of 3-5 specific value-add areas based on their profile"]
  },
  "financialAnalysis": {
    "totalCapitalAvailable": number,
    "typicalTicketSize": "string - estimated range",
    "investmentCapacity": "string - how many deals they can realistically do",
    "capitalEfficiency": "High | Medium | Low - how well their capital matches their stage preferences"
  },
  "overallAssessment": {
    "overallRating": "Excellent | Good | Average | Below Average | Poor",
    "overallScore": number (0-100),
    "keyStrengths": ["array of 3-5 specific strengths"],
    "keyWeaknesses": ["array of 3-5 specific weaknesses"],
    "redFlags": ["array of any serious concerns"],
    "bestMatchFor": ["array of startup types/stages this investor is best suited for"],
    "recommendations": ["array of 3-5 actionable recommendations for Tehele team"]
  }
}

IMPORTANT:
- Be objective and data-driven
- Base classifications on Tehele's specific framework criteria
- Consider their capital relative to their stage preferences
- Assess if their involvement level matches what's needed at each stage
- Flag if ticket sizes don't match their stated investment stage
- Evaluate their preferred industries and how well they align with startup needs
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a venture capital analyst specializing in investor due diligence and profiling. You provide thorough, objective assessments based on data. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      const createdBy = investor.createdBy as any;
      const investorName =
        investor.companyName ||
        `${createdBy?.firstName} ${createdBy?.lastName}`;

      // Cache the report for 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.investorDDCacheModel.findOneAndUpdate(
        { investorId: new Types.ObjectId(investorId) },
        {
          investorId: new Types.ObjectId(investorId),
          investorName,
          analysis,
          expiresAt,
        },
        { upsert: true, new: true },
      );

      console.log('Investor DD report cached successfully');

      return {
        investorId,
        investorName,
        generatedAt: new Date(),
        analysis,
        cached: false,
      };
    } catch (error) {
      console.error('Error generating investor due diligence:', error);
      throw new InternalServerErrorException(
        'Failed to generate investor due diligence report',
      );
    }
  }
}
