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
  ) {
    return this.blogService.createBlog(
      title,
      content,
      coverPhotoId,
      req.user._id,
      category,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Fetch blog posts' })
  async getBlogs(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 100,
  ) {
    return this.blogService.getBlogs(search, category, page, perPage);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Fetch blog categories' })
  async getCategories() {
    return this.blogService.getCategories();
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
}
