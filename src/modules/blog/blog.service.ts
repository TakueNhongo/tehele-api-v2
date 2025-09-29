import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {
    const blog = new this.blogModel({
      title,
      content,
      coverPhotoId,
      author,
      category: new Types.ObjectId(category),
    });
    return blog.save();
  }

  async getBlogs(search?: string, category?: string, page = 1, perPage = 100) {
    const filter: any = {};

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category) filter.category = new Types.ObjectId(category);

    const blogs = await this.blogModel
      .find(filter)
      .populate('author') // Include author details
      .populate('category', 'name') // Include category name
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

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
      { title, content, coverPhotoId, category, author: updatedBy },
      { new: true },
    );

    if (!updatedBlog) throw new NotFoundException('Blog post not found');

    await updatedBlog.populate(['author', 'category']);

    return updatedBlog;
  }

  async deleteBlog(id: string) {
    const deletedBlog = await this.blogModel.findByIdAndDelete(id);
    if (!deletedBlog) throw new NotFoundException('Blog post not found');
    return { message: 'Blog deleted successfully' };
  }

  async createCategory(name: string) {
    const category = new this.categoryModel({ name });
    return category.save();
  }

  async getCategories() {
    return this.categoryModel.find();
  }
}
