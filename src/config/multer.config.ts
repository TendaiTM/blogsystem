import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration for blog post media (images and videos)
export const blogPostMediaConfig = {
  storage: diskStorage({
    destination: './uploads/blog-posts', // Separate directory for blog post media
    filename: (req, file, cb) => {
      // Generate unique filename for blog post media
      const randomName = uuidv4();
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Validate file types for blog posts (images and videos)
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      // Allow image files
      cb(null, true);
    } else if (file.mimetype.match(/\/(mp4|webm|ogg|mov|avi)$/)) {
      // Allow video files (expanded types)
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
  storage: diskStorage({
    destination: './uploads/profile-pictures', // Separate directory for profile pictures
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `profile-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Only allow image files for profile pictures
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
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
  storage: diskStorage({
    destination: './uploads/generic',
    filename: (req, file, cb) => {
      const randomName = uuidv4();
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Allow all file types for generic uploads
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for generic files
  },
};