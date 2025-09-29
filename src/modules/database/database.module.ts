import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

//import mongoose from 'mongoose';
import { databaseConfig } from 'src/config/database.config';

/**
 * mongoose
  .connect(databaseConfig.uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

 */
@Module({
  imports: [MongooseModule.forRoot(databaseConfig.uri, {})],
})
export class DatabaseModule {}
