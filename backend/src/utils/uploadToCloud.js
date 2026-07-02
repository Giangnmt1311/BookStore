const cloudinary = require('../config/cloud');
const { Readable } = require('stream');
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;  
  if (!url.includes('cloudinary.com')) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    const afterUpload = urlParts.slice(uploadIndex + 1).join('/');    
    const publicId = afterUpload.replace(/\.[^/.]+$/, '');
    const parts = publicId.split(',');
    const lastPart = parts[parts.length - 1];
    if (/^v\d+$/.test(lastPart) && parts.length > 1) {
      return parts.slice(0, -1).join(',');
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};


const uploadToCloudinary = async (fileBuffer, folder, resourceType = 'auto', publicId = null, originalFilename = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      overwrite: false,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    } else {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      
      if (originalFilename) {
        const lastDotIndex = originalFilename.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? originalFilename.substring(0, lastDotIndex) : originalFilename;
        const extension = lastDotIndex > 0 ? originalFilename.substring(lastDotIndex) : '';
        
        if (resourceType === 'raw' && extension) {
          uploadOptions.public_id = `${folder}/${nameWithoutExt}_${timestamp}_${random}${extension}`;
        } else {
          uploadOptions.public_id = `${folder}/${nameWithoutExt}_${timestamp}_${random}`;
        }
      } else {
        uploadOptions.public_id = `${folder}/file_${timestamp}_${random}`;
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

const uploadFile = async (file, folder, resourceType = 'auto', publicId = null) => {
  try {
    const result = await uploadToCloudinary(
      file.buffer, 
      folder, 
      resourceType, 
      publicId, 
      file.originalname
    );
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const deleteFromCloudinaryByUrl = async (url, resourceType = 'image') => {
  try {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
      console.warn('Could not extract public ID from URL:', url);
      return { result: 'not_found' };
    }
    return await deleteFromCloudinary(publicId, resourceType);
  } catch (error) {
    console.error('Error deleting from Cloudinary by URL:', error);
    return { result: 'error', error: error.message };
  }
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteFromCloudinaryByUrl,
  extractPublicIdFromUrl,
};

