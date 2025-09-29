import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

export type DocumentCategoryDocument = DocumentCategory & MongoDocument;

@Schema({ timestamps: true })
export class DocumentCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;
}

export const DocumentCategorySchema =
  SchemaFactory.createForClass(DocumentCategory);
