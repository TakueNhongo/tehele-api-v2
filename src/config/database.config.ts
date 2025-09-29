import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig = {
  uri: process.env.MONGODB_URI,
};
