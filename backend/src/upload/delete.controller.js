const { deleteFromCloudinaryByUrl } = require('../utils/uploadToCloud');
const deleteFile = async (req, res) => {
  try {
    const { url, resourceType = 'image' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const validResourceTypes = ['image', 'video', 'raw'];
    if (!validResourceTypes.includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resourceType. Use "image", "video", or "raw"' });
    }

    const result = await deleteFromCloudinaryByUrl(url, resourceType);
    
    res.status(200).json({
      message: 'File deleted successfully',
      result: result,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file', message: error.message });
  }
};

const deleteAudioFile = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await deleteFromCloudinaryByUrl(url, 'video');
    
    res.status(200).json({
      message: 'Audio file deleted successfully',
      result: result,
    });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({ error: 'Failed to delete audio file', message: error.message });
  }
};

const deleteRawFile = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await deleteFromCloudinaryByUrl(url, 'raw');
    
    res.status(200).json({
      message: 'File deleted successfully',
      result: result,
    });
  } catch (error) {
    console.error('Delete raw file error:', error);
    res.status(500).json({ error: 'Failed to delete file', message: error.message });
  }
};

module.exports = {
  deleteFile,
  deleteAudioFile,
  deleteRawFile,
};

