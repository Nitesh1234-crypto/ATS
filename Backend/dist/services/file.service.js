"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ats-scoring-dev';
const USE_S3 = process.env.USE_S3 === 'true';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';
class FileService {
    static async uploadFile(file, prefix) {
        const fileName = `${prefix}/${Date.now()}-${file.originalname}`;
        if (USE_S3) {
            await s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            return `s3://${BUCKET_NAME}/${fileName}`;
        }
        else {
            // Local fallback
            await promises_1.default.mkdir(path_1.default.dirname(`${LOCAL_STORAGE_PATH}/${fileName}`), { recursive: true });
            await promises_1.default.writeFile(`${LOCAL_STORAGE_PATH}/${fileName}`, file.buffer);
            return `${LOCAL_STORAGE_PATH}/${fileName}`;
        }
    }
    static async getFileUrl(filePath) {
        if (filePath.startsWith('s3://')) {
            const key = filePath.replace(`s3://${BUCKET_NAME}/`, '');
            const command = new client_s3_1.GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });
            return (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
        }
        else {
            return filePath;
        }
    }
    static async deleteFile(filePath) {
        if (filePath.startsWith('s3://')) {
            const key = filePath.replace(`s3://${BUCKET_NAME}/`, '');
            await s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }));
        }
        else {
            try {
                await promises_1.default.unlink(filePath);
            }
            catch (error) {
                console.warn('File not found for deletion:', filePath);
            }
        }
    }
    static async cleanupExpiredFiles() {
        // Clean up files older than 7 days
        const expirationDays = 7;
        const cutoffTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
        if (!USE_S3) {
            // Local cleanup logic
            const files = await promises_1.default.readdir(LOCAL_STORAGE_PATH);
            for (const file of files) {
                const filePath = path_1.default.join(LOCAL_STORAGE_PATH, file);
                const stats = await promises_1.default.stat(filePath);
                if (stats.mtime.getTime() < cutoffTime) {
                    await this.deleteFile(filePath);
                }
            }
        }
    }
}
exports.FileService = FileService;
