import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { RequestWithUser } from 'src/types/requests.type';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post' })
  async createBlog(
    @Req() req: RequestWithUser,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('coverPhotoId') coverPhotoId: string,
    @Body('category') category: string,
    @Body('targetProfileType')
    targetProfileType: 'startup' | 'investor' | 'all' = 'all',
  ) {
    return this.blogService.createBlog(
      title,
      content,
      coverPhotoId,
      req.user._id,
      category,
      targetProfileType,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Fetch blog posts' })
  async getBlogs(
    @Req() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 100,
  ) {
    return this.blogService.getBlogs(
      search,
      category,
      page,
      perPage,
      req.profileType,
    );
  }

  @Public()
  @Get('website')
  @ApiOperation({ summary: 'Fetch blog posts' })
  async getBlogForWebsite(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 100,
  ) {
    return this.blogService.getBlogs(search, category, page, perPage, 'all');
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Fetch blog categories' })
  async getCategories() {
    return this.blogService.getCategories();
  }

  @Public()
  @Get('top-startups')
  @ApiOperation({ summary: 'Get top startups article with fallback' })
  async getTopStartupsArticle() {
    console.log('Seeking');
    return this.blogService.getTopStartupsArticle();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single blog post by ID' })
  async getBlogById(@Param('id') id: string) {
    return this.blogService.getBlogById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a blog post' })
  async updateBlog(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('title') title?: string,
    @Body('content') content?: string,
    @Body('coverPhotoId') coverPhotoId?: string,
    @Body('category') category?: string,
  ) {
    return this.blogService.updateBlog(
      id,
      title,
      content,
      coverPhotoId,
      category,
      req.user._id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog post' })
  async deleteBlog(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.blogService.deleteBlog(id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@Body('name') name: string) {
    return this.blogService.createCategory(name);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(@Param('id') id: string, @Body('name') name: string) {
    return this.blogService.updateCategory(id, name);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    return this.blogService.deleteCategory(id);
  }

  @Patch(':id/set-top-startups')
  @ApiOperation({ summary: 'Set article as top startups article' })
  async setTopStartupsArticle(@Param('id') id: string) {
    return this.blogService.setTopStartupsArticle(id);
  }

  @Patch(':id/unset-top-startups')
  @ApiOperation({ summary: 'Unset article as top startups article' })
  async unsetTopStartupsArticle(@Param('id') id: string) {
    return this.blogService.unsetTopStartupsArticle(id);
  }
}
