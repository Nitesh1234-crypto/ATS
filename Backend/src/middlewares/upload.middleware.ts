import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/msword'
  ];
  
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 2, // Max 2 files (resume + JD)
  },
});

export const uploadResume = uploadMiddleware.single('resume');
export const uploadResumeAndJD = uploadMiddleware.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jd', maxCount: 1 }
]);
