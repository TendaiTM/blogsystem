import { memoryStorage } from 'multer';

// Configuration for blog post media (images and videos)
export const blogPostMediaConfig = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    // Validate file types for blog posts (images and videos)
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      // Allow image files
      cb(null, true);
    } else if (file.mimetype.match(/\/(mp4|webm|ogg|mov|avi|mpeg)$/)) {
      // Allow video files
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only images and videos are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for blog post media
  },
};

// Configuration for profile pictures (images only)
export const profilePictureConfig = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    // Only allow image files for profile pictures
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new Error('Only image files are allowed for profile pictures!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  },
};

// Generic configuration for any file type
export const genericFileConfig = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    // Allow all file types for generic uploads
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for generic files
  },
};