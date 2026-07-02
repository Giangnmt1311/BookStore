const { uploadFile } = require('../utils/uploadToCloud');
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'general'; // Default folder
    const result = await uploadFile(req.file, folder, 'image');

    res.status(200).json({
      message: 'File uploaded successfully',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file', message: error.message });
  }
};

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await uploadFile(req.file, 'audio', 'video'); // Cloudinary treats audio as video

    res.status(200).json({
      message: 'Audio file uploaded successfully',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio file', message: error.message });
  }
};

module.exports = {
  uploadImage,
  uploadAudio,
};

