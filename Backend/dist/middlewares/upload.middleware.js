"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResumeAndJD = exports.uploadResume = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/msword'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 2, // Max 2 files (resume + JD)
    },
});
exports.uploadResume = exports.uploadMiddleware.single('resume');
exports.uploadResumeAndJD = exports.uploadMiddleware.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'jd', maxCount: 1 }
]);
