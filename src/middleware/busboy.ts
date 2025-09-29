// busboy.middleware.ts
import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import * as Busboy from 'busboy';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadedMessageFile } from 'src/types/requests.type';

function cleanupFiles(filePaths: string[]) {
  try {
    for (const filePath of filePaths) {
      fs.unlink(filePath, (err) => {
        if (err) {
        }
      });
    }
  } catch (e) {}
}

@Injectable()
export class BusboyMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    if (
      req.method === 'POST' &&
      req.headers['content-type']?.includes('multipart/form-data')
    ) {
      const busboy = Busboy({ headers: req.headers });

      const body = {};
      const codeInterpreterAttachments = [];
      const fileSearchAttachments = [];
      const generalAttachments = [];

      // Ensure upload directory exists
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      let fileWritesPending = 0;
      let busboyFinished = false;

      // Array to keep track of file paths for cleanup
      const uploadedFilePaths: string[] = [];

      // File counts per field
      const fileCounts: { [fieldname: string]: number } = {};

      // Limits
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
      const MAX_FILES_PER_FIELD = 2;

      let errorOccurred = false;

      busboy.on('file', (fieldname, file, info) => {
        if (errorOccurred) {
          // If an error has occurred, ignore further file events
          file.resume(); // Drain the stream
          return;
        }

        // Limit the number of files per field
        fileCounts[fieldname] = (fileCounts[fieldname] || 0) + 1;
        if (fileCounts[fieldname] > MAX_FILES_PER_FIELD) {
          errorOccurred = true;
          cleanupAndTerminate(
            new BadRequestException(
              `Exceeded maximum number of files (${MAX_FILES_PER_FIELD}) for field "${fieldname}"`,
            ),
          );
          return;
        }

        const { filename, mimeType } = info;
        const uniqueFileName = `${uuidv4()}_${filename}`;
        const saveTo = path.join(uploadDir, uniqueFileName);

        // Add the file path to the array for potential cleanup
        uploadedFilePaths.push(saveTo);

        fileWritesPending++;

        let fileSize = 0;

        const fileStream = fs.createWriteStream(saveTo);

        file.on('data', (data) => {
          fileSize += data.length;
          if (fileSize > MAX_FILE_SIZE) {
            errorOccurred = true;
            cleanupAndTerminate(
              new BadRequestException(
                `File size exceeds the limit of ${
                  MAX_FILE_SIZE / (1024 * 1024)
                } MB`,
              ),
            );
          }
        });

        file.on('error', (err) => {
          if (!errorOccurred) {
            errorOccurred = true;
            cleanupAndTerminate(
              new BadRequestException('Error receiving file - ' + err.message),
            );
          }
        });

        fileStream.on('error', (err) => {
          if (!errorOccurred) {
            errorOccurred = true;
            cleanupAndTerminate(
              new BadRequestException('Error saving file - ' + err.message),
            );
          }
        });

        fileStream.on('finish', () => {
          if (errorOccurred) {
            return;
          }
          const fileData: UploadedMessageFile = {
            originalname: filename,
            filename: uniqueFileName,
            path: saveTo,
            mimetype: mimeType,
          };

          if (fieldname === 'codeInterpreterAttachments') {
            codeInterpreterAttachments.push(fileData);
          } else if (fieldname === 'fileSearchAttachments') {
            fileSearchAttachments.push(fileData);
          } else {
            generalAttachments.push(fileData);
          }
          fileWritesPending--;
          if (busboyFinished && fileWritesPending === 0) {
            finalizeRequest();
          }
        });

        file.pipe(fileStream);

        function cleanupAndTerminate(error: BadRequestException) {
          file.destroy(); // Destroy the file stream
          busboy.destroy(); // End the Busboy parser
          cleanupFiles(uploadedFilePaths); // Cleanup any files that were already saved
          return next(error); // Pass the error to the next middleware
        }
      });

      busboy.on('field', (fieldname, val) => {
        body[fieldname] = val;
      });

      busboy.on('error', (error) => {
        if (!errorOccurred) {
          errorOccurred = true;
          // Clean up the files
          cleanupFiles(uploadedFilePaths);
          next(
            new BadRequestException(
              'Error parsing form data - ' + error.message,
            ),
          );
        }
      });

      busboy.on('finish', () => {
        busboyFinished = true;
        if (fileWritesPending === 0 && !errorOccurred) {
          finalizeRequest();
        }
      });

      function finalizeRequest() {
        req.body = body; // Populate the request body
        req.attachments = {
          ...(generalAttachments.length > 0 && { generalAttachments }),
        }; // Attach files to the request object
        next();
      }

      req.pipe(busboy);

      // Handle request errors (e.g., client aborted)
      req.on('aborted', () => {
        if (!errorOccurred) {
          errorOccurred = true;
          // Clean up the files
          cleanupFiles(uploadedFilePaths);
        }
      });

      req.on('error', (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          // Clean up the files
          cleanupFiles(uploadedFilePaths);
          next(new BadRequestException('Request error - ' + err.message));
        }
      });
    } else {
      next();
    }
  }
}
