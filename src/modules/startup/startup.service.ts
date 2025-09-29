import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAI } from 'openai';
import { Startup, StartupDocument } from './schemas/startup.schema';
import { CreateStartupDto } from './dto/create-startup.dto';
import { UpdateStartupDto } from './dto/update-startup.dto';
import { LikeService } from '../like/like.service';
import { ConnectionService } from '../connection/connection.service';
import {
  Connection,
  ConnectionDocument,
} from '../connection/schemas/connection.schema';
import {
  StartupViewHistory,
  StartupViewHistoryDocument,
} from './schemas/startup-view-history.schema';

import { Message, MessageDocument } from '../message/schemas/message.schema';
import { Like, LikeDocument } from '../like/schemas/like.schema';
import { ProfileTypeEnum } from '../message/enums/message.enums';
import { LikeStatusEnum } from '../like/enums/like.enums';
import {
  Investor,
  InvestorDocument,
} from '../investor/schemas/investor.schema';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { PerformanceHistoryStatusEnum } from './enums/startup.enums';
import { TeamMemberService } from '../team-member/team-member.service';
import { UserService } from '../user/user.service';

@Injectable()
export class StartupService {
  constructor(
    @InjectModel(Startup.name) private startupModel: Model<StartupDocument>,
    @Inject(forwardRef(() => LikeService))
    private readonly likeService: LikeService,

    @InjectModel(StartupViewHistory.name)
    private startupViewHistoryModel: Model<StartupViewHistoryDocument>,

    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,

    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>,
    @Inject(forwardRef(() => TeamMemberService))
    private readonly teamMemberService: TeamMemberService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async createStartup(
    createStartupDto: CreateStartupDto,
    userId: Types.ObjectId,
    creatorEmail?: string,
  ): Promise<StartupDocument> {
    try {
      // Create the startup
      const startup = await this.startupModel.create({
        ...createStartupDto,
        team: undefined,
        createdBy: userId,
      });

      // Create team members if team data is provided
      if (createStartupDto.team && createStartupDto.team.length > 0) {
        // Extract emails for bulk user lookup
        const teamEmails = createStartupDto.team
          .map((member) => member.email)
          .filter((email) => email && email.trim());

        // Bulk find users by emails
        const existingUsers =
          teamEmails.length > 0
            ? await this.userService.findUsersByEmails(teamEmails)
            : [];

        // Create a map of email to user for quick lookup
        const emailToUserMap = new Map<string, any>();
        existingUsers.forEach((user) => {
          emailToUserMap.set(user.email.toLowerCase().trim(), user);
        });

        // Prepare team member data for bulk creation
        const teamMemberDataList = createStartupDto.team.map((member) => {
          const teamMemberData: any = {
            startupId: startup._id,
            name: member.name,
            role: member.role,
            bio: member.bio,
            email: member.email,
            isCreator:
              member.email && creatorEmail
                ? member.email.toLowerCase().trim() ===
                  creatorEmail.toLowerCase().trim()
                : false,
            isActive: true,
          };

          // Link to existing user if found
          if (member.email) {
            const normalizedEmail = member.email.toLowerCase().trim();
            const existingUser = emailToUserMap.get(normalizedEmail);
            if (existingUser) {
              teamMemberData.userId = existingUser._id as Types.ObjectId;
            }
          }

          return teamMemberData;
        });

        // Bulk create team members
        const createdTeamMembers =
          await this.teamMemberService.bulkCreateTeamMembers(
            teamMemberDataList,
          );

        // Update startup with team member IDs
        startup.team = createdTeamMembers.map((member) => member._id);
        await startup.save();

        // Bulk update user startup profiles for found users
        if (existingUsers.length > 0) {
          const emailToStartupIdMap = new Map<string, Types.ObjectId>();
          existingUsers.forEach((user) => {
            emailToStartupIdMap.set(
              user.email.toLowerCase().trim(),
              startup._id,
            );
          });

          await this.userService.bulkUpdateUserStartupProfiles(
            emailToStartupIdMap,
          );
        }
      }

      // Update creator's startupProfileIds (only if not already included in team members)
      const normalizedCreatorEmail = creatorEmail?.toLowerCase().trim();
      const creatorInTeam =
        normalizedCreatorEmail &&
        createStartupDto.team?.some(
          (member) =>
            member.email?.toLowerCase().trim() === normalizedCreatorEmail,
        );

      if (!creatorInTeam) {
        await this.userService.updateUserStartupProfile(userId, startup._id);
      }

      // Populate team field before returning
      const populatedStartup = await this.startupModel
        .findById(startup._id)
        .populate('team', 'name role bio email isCreator isActive')
        .populate('createdBy', 'firstName lastName profilePictureId')
        .exec();

      return populatedStartup;
    } catch (error) {
      console.error('Error creating startup:', error);
      throw new InternalServerErrorException('Failed to create startup');
    }
  }

  async generateStartupInsights_(startupId) {
    const startupData = await this.startupModel.findById(startupId).lean();
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are an AI startup advisor specializing in startup funding analysis.

Given the following startup data, generate personalized insights and funding recommendations.

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

Please provide a response following this EXACT JSON structure:
{
  "companyName": "String - Name of the startup",
  "fundingStage": "String - Current funding stage",
  "recommendation": {
    "fundingAmount": Number - Recommended funding amount in dollars,
    "valuation": Number - Estimated company valuation in dollars,
    "equityOffering": Number - Recommended equity percentage to offer,
    "confidence": Number - AI confidence score (0-100)
  },
  "metrics": {
    "growthRate": Number - Monthly growth rate percentage,
    "burnRate": Number - Monthly burn rate in dollars,
    "runway": Number - Remaining runway in months,
    "revenue": Number - Monthly revenue in dollars,
    "customerAcquisitionCost": Number - CAC in dollars
  },
  "insights": [
    {
      "type": String - Must be one of: "INVESTMENT_READINESS", "MARKET_POSITION", "BURN_RATE", "GROWTH_TRAJECTORY", "FUNDING_TIMELINE", "CUSTOMER_ACQUISITION", "REVENUE", "PRODUCT_MARKET_FIT", "TEAM", "VALUATION",
      "severity": String - Must be one of: "primary", "positive", "warning", "info",
      "title": String - Short, actionable insight title,
      "description": String - Detailed explanation with specific guidance
    }
  ],
  "fundingInsights": [
    String - Reasons explaining the funding amount recommendation (3-4 bullet points)
  ],
  "valuationInsights": [
    String - Explanations supporting the valuation estimate (3-4 bullet points)
  ],
  "equityInsights": [
    String - Rationale for equity offering recommendation (3-4 bullet points)
  ],
  "milestones": [
    {
      "title": String - Milestone name,
      "description": String - Detailed explanation of the milestone,
      "timeframe": String - Expected timing (e.g., "6-12 months"),
      "status": String - Must be "current" or "upcoming"
    }
  ],
  "growthInsights": [
    String - Strategic insights about growth trajectory (3-4 bullet points)
  ],
  "industry": {
    "avgFundingAmount": Number - Average industry funding at this stage,
    "avgValuation": Number - Average industry valuation at this stage,
    "avgGrowthRate": Number - Average industry growth rate percentage,
    "avgBurnRate": Number - Average industry burn rate in dollars
  }
}

Important guidelines:
1. For insights, include 4 insights covering different aspects of the startup.
2. Types are standardized categories, while severity indicates positive/negative/informative nature.
3. Each insight should have a clear, specific title and actionable description.
4. For milestones, include the current stage plus 2-3 future milestones.
5. All numerical values should be realistic based on the startup's data and industry norms.
6. Focus on providing strategic, actionable advice rather than just restating metrics.
7. Ensure the response is complete, valid JSON with no missing fields.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a startup funding AI advisor that provides strategic insights and recommendations. You always respond with valid JSON that exactly matches the requested schema.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content);
      return response;
    } catch (error) {
      console.error('Error generating startup insights:', error.message);
      throw error;
    }
  }

  async generateStartupInsights(startupId) {
    const startupData = await this.startupModel.findById(startupId).lean();
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are an AI startup advisor specializing in strategic recommendations.

Given the following startup data, generate highly personalized, specific, and actionable recommendations tailored uniquely to the startup's context. Avoid generic advice; ensure each recommendation explicitly references relevant data points provided.

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

Respond strictly using this exact JSON schema:
{
  "financialHealthRecommendations": {
    "burnRateOptimization": "Specific recommendation based on provided burn rate and revenue data.",
    "fundingRecommendations": "Exact funding stage and amount recommendations based on the startup’s existing financial data.",
    "cashFlowManagementTips": "Insights referencing specific financial patterns or historical data provided."
  },
  "growthAndTractionRecommendations": {
    "customerAcquisitionSuggestions": "Concrete customer acquisition strategies derived from provided growth rate, revenue model, and traction.",
    "revenueGrowthTactics": "Detailed revenue growth methods leveraging the startup’s traction, revenue model, and industry specifics."
  },
  "teamAndTalentRecommendations": {
    "roleSpecificHiringRecommendations": "Specific hiring suggestions addressing gaps explicitly identified in the provided team data.",
    "teamCompositionOptimization": "Advice for optimizing team structure based directly on provided team roles and bios."
  },
  "valuationAndEquityRecommendations": {
    "valuationGuidance": "Tailored valuation recommendations using provided valuation, revenue growth, and industry benchmarks.",
    "exitStrategyRecommendations": "Specific exit strategies considering provided business structure, industry dynamics, and market opportunity."
  }
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a startup strategic advisor. Always respond with valid JSON exactly matching the provided schema.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content);
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error generating startup insights:', error.message);
      throw error;
    }
  }

  async submitPerformanceChange(
    startupId: string,
    updateDto: UpdatePerformanceDto,
  ): Promise<StartupDocument> {
    try {
      const startup = await this.startupModel.findById(startupId);
      if (!startup) {
        throw new NotFoundException('Startup not found');
      }
      if (
        startup.performanceHistoryStatus ===
        PerformanceHistoryStatusEnum.ACCEPTED
      ) {
        startup.archivedFinancialHistory = startup.financialHistory;
      }

      if (updateDto.skipStatusChange !== true) {
        startup.performanceHistoryStatus =
          PerformanceHistoryStatusEnum.IN_REVIEW;
      }
      startup.financialHistory = updateDto.data as any;
      await startup.save();
      return startup;
    } catch (e: any) {
      console.log(e.message);
      throw new InternalServerErrorException(e.message);
    }
  }

  async generateInvestorInsights(startupId, investorId) {
    try {
      // Fetch both startup and investor data
      const startupData = await this.startupModel.findById(startupId).lean();
      const investorData = await this.investorModel.findById(investorId).lean();

      if (!startupData || !investorData) {
        throw new Error('Startup or investor not found');
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
Generate personalized investment insights for this investor based on their preferences and the startup's profile. Directly address the investor in a conversational tone.

INVESTOR DATA:
${JSON.stringify(investorData, null, 2)}

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

Please provide a response following this EXACT JSON structure:
{
  "summary": "String - Brief executive summary that describes the startup, its potential, and how well it matches with the investor's preferences and investment strategy",
  "compatibility": {
    "industryFit": Number - Score indicating industry alignment (0-100),
    "stageFit": Number - Score indicating investment stage alignment (0-100),
    "investmentFit": Number - Score indicating investment size alignment (0-100),
    "riskProfile": Number - Score indicating risk alignment (0-100)
  },
  "insights": [
    {
      "type": String - Must be one of: "INDUSTRY_ALIGNMENT", "STAGE_FIT", "INVESTMENT_SIZE", "GROWTH_POTENTIAL", "RISK_ASSESSMENT", "MARKET_OPPORTUNITY", "TEAM_QUALITY", "COMPETITIVE_ADVANTAGE",
      "severity": String - Must be one of: "positive", "neutral", "warning", "negative",
      "title": String - Short, actionable insight title,
      "description": String - Detailed explanation with specific guidance
    }
  ],
  "investmentAnalysis": {
    "recommendedTicketSize": Number - Suggested investment amount in dollars,
    "potentialROI": Number - Estimated ROI percentage,
    "timeToExit": Number - Estimated years to potential exit,
    "confidenceScore": Number - Confidence in the analysis (0-100)
  },
  "riskFactors": [
    {
      "factor": String - Name of the risk factor,
      "severity": String - Must be one of: "high", "medium", "low",
      "description": String - Description of the risk and potential mitigation
    }
  ],
  "opportunities": [
    String - Specific value-add opportunities for this investor (3-4 points)
  ]
}

Important guidelines:
1. The summary should provide a concise overview of the startup's business, its potential, and specifically assess how well it aligns with this investor's criteria and preferences.
2. Include 4 personalized insights that directly relate to this specific investor-startup match.
3. Each insight should provide specific, actionable information relevant to the investor's preferences.
4. Use a conversational tone that directly addresses the investor.
5. For risk factors, include 2 most relevant risks that this specific investor should consider.
6. The recommended ticket size should be within the investor's stated investment range.
7. Opportunity suggestions should leverage the investor's specific background and expertise.
8. Ensure all numerical scores are realistic and justified by the data.
9. Ensure the response is complete, valid JSON with no missing fields.`;

      // Call OpenAI API with the combined data
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an investment advisor specializing in startup funding. Generate personalized insights for an investor evaluating a specific startup.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      // Parse and return the response
      const insights = JSON.parse(completion.choices[0].message.content);
      return insights;
    } catch (error) {
      console.error('Error generating investor insights:', error);
      throw new Error('Failed to generate investor insights');
    }
  }
  async findStartups(query: any): Promise<Startup[]> {
    return this.startupModel
      .find(query)
      .select('companyName industry description tagline logoFileId isVerified')
      .populate('createdBy', 'firstName lastName profilePictureId')
      .lean()
      .exec();
  }

  async getLinkedInvestors(startupId: Types.ObjectId): Promise<any[]> {
    // Validate startupId
    const validStartupId = new Types.ObjectId(startupId);

    // Find investors from connections
    const connections = await this.connectionModel
      .find({ startupId: validStartupId })
      .distinct('investorId');

    // Find investors who liked the startup
    const likes = await this.likeModel
      .find({ startupId: validStartupId, status: LikeStatusEnum.ACTIVE })
      .distinct('investorId');

    // Find investors who messaged the startup
    const messagesFromInvestors = await this.messageModel
      .find({
        receiverStartupProfileId: validStartupId,
        senderProfileType: ProfileTypeEnum.INVESTOR,
      })
      .distinct('senderInvestorProfileId');

    // Combine all investor IDs (removing duplicates)
    const uniqueInvestorIds = [
      ...new Set([
        ...connections.map((id) => id.toString()),
        ...likes.map((id) => id.toString()),
        ...messagesFromInvestors.map((id) => id.toString()),
      ]),
    ].map((id) => new Types.ObjectId(id));

    // Get the investor details
    const investors = await this.investorModel
      .find({ _id: { $in: uniqueInvestorIds } })
      .populate('createdBy', 'firstName lastName email profilePictureId')
      .lean();

    // Add relationship info to each investor
    return investors.map((investor) => {
      return {
        ...investor,
        relationshipTypes: {
          hasConnection: connections.some((id) => id.equals(investor._id)),
          hasLiked: likes.some((id) => id.equals(investor._id)),
          hasMessaged: messagesFromInvestors.some((id) =>
            id.equals(investor._id),
          ),
        },
      };
    });
  }

  async findByIds(startupIds: Types.ObjectId[]): Promise<Startup[]> {
    if (!startupIds.length) return [];

    return this.startupModel
      .find({
        _id: { $in: startupIds },
        isVerified: true,
        isRejected: false,
      })
      .select(
        'companyName industry description tagline website foundingYear fundingStage fundingRaised fundingRequired valuation equityOffering logoFileId',
      )
      .populate('createdBy', 'firstName lastName profilePictureId')
      .lean()
      .exec();
  }

  async getVerifiedStartups(limit?: number): Promise<Startup[]> {
    // If limit is specified, sort descending (newest first), otherwise sort ascending (oldest first)
    const sortOrder: any = limit ? { createdAt: -1 } : { createdAt: 1 };

    return this.startupModel
      .find({
        businessVerified: true,
        isRejected: false,
      })
      .sort(sortOrder)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePictureId')
      .populate('team', 'name role bio email isCreator isActive')
      .exec();
  }

  async updateStartup(
    startupId: Types.ObjectId,
    updateDto: UpdateStartupDto,
  ): Promise<Startup> {
    const startup = await this.startupModel.findOne({ _id: startupId });

    if (!startup)
      throw new NotFoundException('Startup not found or unauthorized');

    Object.assign(startup, updateDto);
    await startup.save();

    return startup;
  }

  private async createViewHistoryIfNotExists(
    startupId: Types.ObjectId,
    investorId: Types.ObjectId,
  ): Promise<void> {
    const existingView = await this.startupViewHistoryModel.findOne({
      startupId,
      investorId,
    });

    if (!existingView) {
      const viewHistory = new this.startupViewHistoryModel({
        startupId,
        investorId,
        viewedAt: new Date(),
      });
      await viewHistory.save();
    }
  }

  async getStartupById(
    startupId: string,
    investorId?: Types.ObjectId,
  ): Promise<
    Startup & {
      investorLiked?: boolean;
      connection?: ConnectionDocument | null;
    }
  > {
    const startup = await this.startupModel
      .findById(startupId)
      .populate('team', 'name role bio email isCreator isActive')
      .lean();

    if (!startup) throw new NotFoundException('Startup not found');

    // If investorId is provided, check both like and connection status
    if (investorId) {
      const [investorLiked, connection] = await Promise.all([
        this.likeService.checkIfLiked(investorId, startup._id),
        this.connectionService.checkExistingConnection(investorId, startup._id),
      ]);

      this.createViewHistoryIfNotExists(startup._id, investorId);

      return {
        ...startup,
        investorLiked,
        connection: connection || null,
      };
    }

    return startup;
  }

  async getStartupByIdForAuth(
    startupId: string,
    investorId?: Types.ObjectId,
  ): Promise<
    Startup & {
      investorLiked?: boolean;
      connection?: ConnectionDocument | null;
    }
  > {
    const startup = await this.startupModel
      .findById(startupId)
      .populate('team', 'name role bio email isCreator isActive')
      .lean();

    return startup;
  }

  async getInvestorViewedStartups(
    investorId: string,
  ): Promise<StartupViewHistory[]> {
    const result = await this.startupViewHistoryModel
      .find({ investorId: new Types.ObjectId(investorId) })
      .sort({ viewedAt: -1 })
      .limit(3)
      .populate('startupId')
      .lean();

    return result.map((item) => ({ ...item, ...item.startupId }));
  }

  async bulkUpdateTeamMembersForStartup(
    startupId: Types.ObjectId,
    teamMembers: Array<{
      name: string;
      role: string;
      bio: string;
      email?: string;
    }>,
    creatorEmail?: string,
  ): Promise<void> {
    try {
      // Extract emails for bulk user lookup
      const teamEmails = teamMembers
        .map((member) => member.email)
        .filter((email) => email && email.trim());

      // Bulk find users by emails
      const existingUsers =
        teamEmails.length > 0
          ? await this.userService.findUsersByEmails(teamEmails)
          : [];

      // Create a map of email to user for quick lookup
      const emailToUserMap = new Map<string, any>();
      existingUsers.forEach((user) => {
        emailToUserMap.set(user.email.toLowerCase().trim(), user);
      });

      // Prepare team member data for bulk creation
      const teamMemberDataList = teamMembers.map((member) => {
        const teamMemberData: any = {
          startupId: startupId,
          name: member.name,
          role: member.role,
          bio: member.bio,
          isCreator:
            member.email && creatorEmail
              ? member.email.toLowerCase().trim() ===
                creatorEmail.toLowerCase().trim()
              : false,
          isActive: true,
        };

        // Link to existing user if found
        if (member.email) {
          const normalizedEmail = member.email.toLowerCase().trim();
          const existingUser = emailToUserMap.get(normalizedEmail);
          if (existingUser) {
            teamMemberData.userId = existingUser._id as Types.ObjectId;
          }
        }

        return teamMemberData;
      });

      // Bulk create team members
      const createdTeamMembers =
        await this.teamMemberService.bulkCreateTeamMembers(teamMemberDataList);

      // Update startup with team member IDs
      await this.startupModel.findByIdAndUpdate(startupId, {
        team: createdTeamMembers.map((member) => member._id),
      });

      // Bulk update user startup profiles for found users
      if (existingUsers.length > 0) {
        const emailToStartupIdMap = new Map<string, Types.ObjectId>();
        existingUsers.forEach((user) => {
          emailToStartupIdMap.set(user.email.toLowerCase().trim(), startupId);
        });

        await this.userService.bulkUpdateUserStartupProfiles(
          emailToStartupIdMap,
        );
      }
    } catch (error) {
      console.error('Error bulk updating team members for startup:', error);
      throw new InternalServerErrorException(
        'Failed to bulk update team members',
      );
    }
  }
}
