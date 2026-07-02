const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  else if (file.mimetype === 'application/pdf') {
    cb(null, true);
  }
  else if (file.mimetype === 'text/plain') {
    cb(null, true);
  }
  else if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  }
  else {
    cb(new Error('Invalid file type. Only images, PDFs, text files, and audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = upload;

