import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  author: Types.ObjectId;

  @Prop({ type: String }) // File ID of the cover photo
  coverPhotoId?: string;

  @Prop({ type: Number, default: 0 }) // View count
  views: number;

  @Prop({ type: Types.ObjectId, ref: 'Category' }) // Reference to category
  category: Types.ObjectId;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
