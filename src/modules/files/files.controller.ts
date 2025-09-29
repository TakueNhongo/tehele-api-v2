import {
  Controller,
  Post,
  Req,
  Param,
  Get,
  Res,
  NotFoundException,
  HttpStatus,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Response } from 'express';
import { RequestWithAttachments } from 'src/types/requests.type';
import { Public } from 'src/decorators/public.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Public()
  @Post('upload')
  async uploadFile(
    @Req() req: RequestWithAttachments,
    @Res() res: Response,
    @Body('documentType')
    documentType:
      | 'profile_picture'
      | 'logo'
      | 'pitch_deck'
      | 'message_attachment'
      | null, // Pass documentType in the request body
  ) {
    try {
      const file = req.attachments?.generalAttachments[0];

      // Call the upload service with the provided documentType
      const result = await this.fileService.uploadFile(
        file,
        documentType,
        req.user?._id,
        req.profileId,
        req.profileType,
      );

      return res.status(HttpStatus.CREATED).send(result);
    } catch (e) {
      console.log('Error', e.message);
      this.fileService.cleanupFiles(
        [...req.attachments.generalAttachments].map((item) => item.path),
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: e.message });
    }
  }

  @Public()
  @Get('info/:fileId')
  async getFileInfo(@Param('fileId') fileId: string, @Res() res: Response) {
    try {
      const fileInfo = await this.fileService.getFileInfo(fileId);
      return res.status(HttpStatus.OK).json(fileInfo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving file information',
        error: error.message,
      });
    }
  }

  // Fetch endpoint for profile picture with optional compression
  @Public()
  @Get(':fileId')
  async fetchFile(@Param('fileId') fileId: string, @Res() res: Response) {
    try {
      const { stream, mimeType } = await this.fileService.fetchFile(fileId);

      // Set the correct content type
      res.setHeader('Content-Type', mimeType);

      // Stream the file to the client directly
      stream.pipe(res);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
