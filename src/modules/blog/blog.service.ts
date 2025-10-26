import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from './blog.schema';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createBlog(
    title: string,
    content: string,
    coverPhotoId: string,
    author: Types.ObjectId,
    category: string,
    targetProfileType: 'startup' | 'investor' | 'all' = 'all',
  ) {
    const blog = new this.blogModel({
      title,
      content,
      coverPhotoId,
      author,
      category: new Types.ObjectId(category),
      targetProfileType,
    });
    return blog.save();
  }

  async getBlogs(
    search?: string,
    category?: string,
    page = 1,
    perPage = 100,
    profileType?: 'startup' | 'investor',
  ) {
    const filter: any = {
      isTopStartups: false,
    };

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category) filter.category = new Types.ObjectId(category);

    // If profileType is provided, filter blogs to targetProfileType of that type or 'all'
    if (profileType) {
      filter.targetProfileType = { $in: [profileType, 'all'] };
    }

    const blogs = await this.blogModel
      .find(filter)
      .populate('author') // Include author details
      .populate('category', 'name') // Include category name
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    console.log(blogs);

    return blogs;
  }

  async getBlogById(id: string) {
    const blog = await this.blogModel
      .findById(id)
      .populate('author')
      .populate('category');

    if (!blog) throw new NotFoundException('Blog post not found');

    // Increment view count
    await this.blogModel.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return blog;
  }

  async updateBlog(
    id: string,
    title?: string,
    content?: string,
    coverPhotoId?: string,
    category?: string,
    updatedBy?: Types.ObjectId,
  ) {
    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      id,
      { 
        title, 
        content, 
        coverPhotoId, 
        category: category ? new Types.ObjectId(category) : undefined,
        author: updatedBy 
      },
      { new: true },
    );

    if (!updatedBlog) throw new NotFoundException('Blog post not found');

    await updatedBlog.populate(['author', 'category']);

    return updatedBlog;
  }

  async deleteBlog(id: string) {
    // Check if this is a top startups article
    const blog = await this.blogModel.findById(id);
    if (!blog) throw new NotFoundException('Blog post not found');

    if (blog.isTopStartups) {
      throw new BadRequestException(
        'Cannot delete the Top Startups featured article. You can only update it.',
      );
    }

    const deletedBlog = await this.blogModel.findByIdAndDelete(id);
    return { message: 'Blog deleted successfully' };
  }

  async createCategory(name: string) {
    const category = new this.categoryModel({ name });
    return category.save();
  }

  async getCategories() {
    return this.categoryModel.find().sort({ createdAt: -1 });
  }

  async updateCategory(id: string, name: string) {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { name },
      { new: true },
    );
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async deleteCategory(id: string) {
    // Check if category is being used by any blog posts
    const blogsUsingCategory = await this.blogModel.countDocuments({
      category: id,
    });

    if (blogsUsingCategory > 0) {
      throw new BadRequestException(
        'Cannot delete category that is being used by blog posts',
      );
    }

    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) throw new NotFoundException('Category not found');
    return { message: 'Category deleted successfully' };
  }

  async setTopStartupsArticle(id: string) {
    // First, unset isTopStartups from all other blogs
    await this.blogModel.updateMany(
      { isTopStartups: true },
      { isTopStartups: false },
    );

    // Then set it for the specified blog
    const blog = await this.blogModel
      .findByIdAndUpdate(id, { isTopStartups: true }, { new: true })
      .populate('author')
      .populate('category');

    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async unsetTopStartupsArticle(id: string) {
    const blog = await this.blogModel
      .findByIdAndUpdate(id, { isTopStartups: false }, { new: true })
      .populate('author')
      .populate('category');

    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async getTopStartupsArticle() {
    // First try to find an article specifically marked as top startups
    let blog = await this.blogModel
      .findOne({ isTopStartups: true })
      .populate('author')
      .populate('category')
      .sort({ createdAt: -1 });

    // If no top startups article found, fallback to any article
    if (!blog) {
      blog = await this.blogModel
        .findOne()
        .populate('author')
        .populate('category')
        .sort({ createdAt: -1 });
    }

    if (!blog) throw new NotFoundException('No blog posts found');

    return blog;
  }
}
