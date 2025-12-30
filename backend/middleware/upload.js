//middleware/upload.js
import multer from 'multer';
import path from 'path';

// Store files in memory for direct upload to Firebase
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
  if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

export default upload;
