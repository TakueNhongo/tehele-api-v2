import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import * as Jimp from 'jimp';
import { GridFSBucket, GridFSBucketReadStream } from 'mongodb'; // Native GridFSBucket API from MongoDB

import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra'; // For deleting the file

import { Readable } from 'stream';
import { UploadedMessageFile } from 'src/types/requests.type';
import { UserService } from '../user/user.service';
import { StartupService } from '../startup/startup.service';
import { InvestorService } from '../investor/investor.service';

@Injectable()
export class FilesService {
  private bucket: GridFSBucket;

  constructor(
    @InjectConnection() private readonly connection: Connection,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => StartupService))
    private startupService: StartupService,
    @Inject(forwardRef(() => InvestorService))
    private investorService: InvestorService,
  ) {
    this.bucket = new GridFSBucket(this.connection.db as any, {
      bucketName: 'uploads',
    });
  }

  async onModuleInit() {
    try {
      // Create the TTL index for 'assistant_attachments' expiration if it doesn't exist
      await this.connection.db
        .collection('uploads.files')
        .createIndex(
          { 'metadata.expiration': 1 },
          { expireAfterSeconds: 0, background: true },
        );
    } catch (error) {}
  }

  cleanupFiles(filePaths: string[]) {
    for (const filePath of filePaths) {
      fs.unlink(filePath, (err) => {
        if (err) {
        }
      });
    }
  }

  async uploadFile(
    file: UploadedMessageFile,
    documentType?: string,
    userId?: Types.ObjectId,
    profileId?: Types.ObjectId,
    profileType?: 'startup' | 'investor',
  ): Promise<{ _id: Types.ObjectId }> {
    const { originalname, path: filePath } = file;

    let readStream = fs.createReadStream(filePath);
    let finalFilePath = filePath;

    try {
      // Compress only if it's a profile picture and the file is larger than 100KB

      // Create a writable stream to GridFS using openUploadStream
      const uploadStream = this.bucket.openUploadStream(originalname, {
        contentType: file.originalname.split('.').pop(), // Infer content type from file extension
        metadata: {
          mimetype: file.mimetype,
        }, // Optional metadata
      });

      const fileId = uploadStream.id; // Get the file _id before the upload finishes

      // Pipe the file into GridFS
      readStream.pipe(uploadStream);

      return new Promise((resolve, reject) => {
        uploadStream.on('finish', async () => {
          try {
            // Update user profile picture if applicable
            if (documentType === 'profile_picture' && userId) {
              await this.userService.updateProfile(userId, {
                profilePictureFileId: fileId.toString(),
              });
            }

            // Update profile documents (logo or pitch deck)
            if (
              (documentType === 'logo' || documentType === 'pitch_deck') &&
              profileId
            ) {
              if (profileType === 'startup') {
                // Handle startup profile updates
                const updateData =
                  documentType === 'logo'
                    ? { logoFileId: fileId.toString() }
                    : { pitchDeckFileId: fileId.toString() };

                await this.startupService.updateStartup(profileId, updateData);
              } else {
                // Handle investor profile updates (logo only for investors)
                await this.investorService.updateInvestorProfile(profileId, {
                  logoFileId: fileId.toString(),
                });
              }
            }

            // Clean up temporary file and resolve with file ID
            await fsExtra.remove(finalFilePath);
            resolve({ _id: fileId } as any);
          } catch (err) {
            console.log('Error', err.message);
            // Clean up temporary file even on error
            await fsExtra.remove(finalFilePath).catch((cleanupErr) => {
              console.error('Error during file cleanup:', cleanupErr);
            });

            reject(err);
          }
        });

        uploadStream.on('error', async (err) => {
          console.log('Error', err.message);
          // Ensure the file is deleted on error
          await fsExtra.remove(finalFilePath);
          reject(err);
        });
      });
    } catch (error) {
      console.log('Error', error.message);
      // Clean up the local file in case of error
      await fsExtra.remove(finalFilePath);
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }

  // Compress the image to make it under 100KB
  async compressImage(buffer: Buffer): Promise<Buffer> {
    const image = await Jimp.read(buffer);

    // Resize or compress as needed, targeting 100KB or less
    image.quality(80); // Adjust the quality to control compression
    const compressedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    return compressedBuffer;
  }

  // Fetch a file and return it, with optional compression
  async fetchFile(fileId: string): Promise<{
    stream: GridFSBucketReadStream | Readable;
    mimeType: string;
    filename: string;
  }> {
    // Step 1: Find the file metadata using GridFSBucket's find method
    const file = await this.bucket
      .find({ _id: new Types.ObjectId(fileId) })
      .toArray();

    if (!file || file.length === 0) {
      throw new NotFoundException('File not found');
    }

    const fileMetadata = file[0]; // Get the metadata of the file
    const mimeType = fileMetadata.metadata?.mimetype;

    // Step 2: Create a read stream from GridFS
    const readStream = this.bucket.openDownloadStream(
      new Types.ObjectId(fileId),
    );

    return { stream: readStream, mimeType, filename: fileMetadata.filename };
  }

  // Add this method to the FilesService class

  async getFileInfo(fileId: string) {
    try {
      // Find the file metadata using GridFSBucket's find method
      const files = await this.bucket
        .find({ _id: new Types.ObjectId(fileId) })
        .toArray();

      if (!files || files.length === 0) {
        throw new NotFoundException('File not found');
      }

      const fileMetadata = files[0];

      // Return file information without the content
      return {
        _id: fileMetadata._id,
        filename: fileMetadata.filename,
        length: fileMetadata.length,
        chunkSize: fileMetadata.chunkSize,
        uploadDate: fileMetadata.uploadDate,
        contentType:
          fileMetadata.metadata?.mimetype || 'application/octet-stream',
        metadata: fileMetadata.metadata,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error retrieving file information: ${error.message}`);
    }
  }
}
