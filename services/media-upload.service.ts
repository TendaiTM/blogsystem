// services/media-upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'posts');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size (max 50MB for videos, 10MB for images)
    const maxSize = file.mimetype.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, AVI)');
    }
  }

  async saveMediaFile(file: Express.Multer.File): Promise<{ filename: string; filepath: string; mimetype: string }> {
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    // Save file
    await fs.promises.writeFile(filePath, file.buffer);

    return {
      filename: uniqueFilename,
      filepath: `/uploads/posts/${uniqueFilename}`,
      mimetype: file.mimetype
    };
  }

  async deleteMediaFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting media file:', error);
    }
  }

  getMediaFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}