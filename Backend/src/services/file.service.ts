import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ScoringRequest } from '../types';
import path from 'path';
import fs from 'fs/promises';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ats-scoring-dev';
const USE_S3 = process.env.USE_S3 === 'true';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

export class FileService {
  static async uploadFile(file: Express.Multer.File, prefix: string): Promise<string> {
    const fileName = `${prefix}/${Date.now()}-${file.originalname}`;
    
    if (USE_S3) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      return `s3://${BUCKET_NAME}/${fileName}`;
    } else {
      // Local fallback
      await fs.mkdir(path.dirname(`${LOCAL_STORAGE_PATH}/${fileName}`), { recursive: true });
      await fs.writeFile(`${LOCAL_STORAGE_PATH}/${fileName}`, file.buffer);
      return `${LOCAL_STORAGE_PATH}/${fileName}`;
    }
  }

  static async getFileUrl(filePath: string): Promise<string> {
    if (filePath.startsWith('s3://')) {
      const key = filePath.replace(`s3://${BUCKET_NAME}/`, '');
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } else {
      return filePath;
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (filePath.startsWith('s3://')) {
      const key = filePath.replace(`s3://${BUCKET_NAME}/`, '');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
    } else {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('File not found for deletion:', filePath);
      }
    }
  }

  static async cleanupExpiredFiles(): Promise<void> {
    // Clean up files older than 7 days
    const expirationDays = 7;
    const cutoffTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
    
    if (!USE_S3) {
      // Local cleanup logic
      const files = await fs.readdir(LOCAL_STORAGE_PATH);
      for (const file of files) {
        const filePath = path.join(LOCAL_STORAGE_PATH, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() < cutoffTime) {
          await this.deleteFile(filePath);
        }
      }
    }
  }
}
