import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Investors
  @Get('investors')
  async getAllInvestors() {
    return this.adminService.getAllInvestors();
  }

  @Get('investors/:id')
  async getInvestor(@Param('id') id: string) {
    return this.adminService.getInvestorById(id);
  }

  @Patch('investors/:id/verify')
  async verifyInvestor(@Param('id') id: string) {
    return this.adminService.verifyInvestor(id);
  }

  @Patch('investors/:id/reject')
  async rejectInvestor(@Param('id') id: string) {
    return this.adminService.rejectInvestor(id);
  }

  @Post('investors/:id/due-diligence')
  async generateInvestorDueDiligence(@Param('id') id: string) {
    return this.adminService.generateInvestorDueDiligence(id);
  }

  // Startups
  @Get('startups')
  async getAllStartups() {
    return this.adminService.getAllStartups();
  }

  @Get('startups/perfomance-changes')
  async getPerfomanceChanges() {
    return this.adminService.getStartupsWithPendingPerformanceChanges();
  }

  @Get('startups/:id')
  async getStartup(@Param('id') id: string) {
    return this.adminService.getStartupById(id);
  }

  @Patch('startups/:id/verify')
  async verifyStartup(@Param('id') id: string) {
    return this.adminService.verifyStartup(id);
  }

  @Patch('startups/:id/performance/approve-all')
  async approveAllPerformanceChanges(@Param('id') startupId: string) {
    return this.adminService.approveStartupPerformanceChanges(startupId);
  }

  @Patch('startups/:id/performance/reject-all')
  async rejectAllPerformanceChanges(@Param('id') startupId: string) {
    return this.adminService.rejectAllPerformanceChanges(startupId);
  }

  @Patch('startups/:id/reject')
  async rejectStartup(@Param('id') id: string) {
    return this.adminService.rejectStartup(id);
  }

  @Post('startups/:id/due-diligence')
  async generateStartupDueDiligence(@Param('id') id: string) {
    return this.adminService.generateStartupDueDiligence(id);
  }

  @Public()
  @Post('admins')
  async createAdmin(@Body() createAdminDto: any) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('admins')
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Get('admins/:id')
  async getAdmin(@Param('id') id: string) {
    return this.adminService.getAdminById(id);
  }

  @Delete('admins/:id')
  async deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }

  @Post('investments')
  async createInvestment(@Body() createInvestmentDto: any) {
    return this.adminService.createInvestment(createInvestmentDto);
  }

  // Investments
  @Get('investments')
  async getAllInvestments() {
    return this.adminService.getAllInvestments();
  }

  @Get('investments/:id')
  async getInvestment(@Param('id') id: string) {
    return this.adminService.getInvestmentById(id);
  }

  @Patch('investments/:id/verify')
  async verifyInvestment(@Param('id') id: string) {
    return this.adminService.verifyInvestment(id);
  }

  @Patch('investments/:id/reject')
  async rejectInvestment(@Param('id') id: string) {
    return this.adminService.rejectInvestment(id);
  }

  @Get('investments/pending')
  async getPendingInvestments() {
    return this.adminService.getPendingInvestments();
  }

  @Get('investments/verified')
  async getVerifiedInvestments() {
    return this.adminService.getVerifiedInvestments();
  }
}
