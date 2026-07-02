import getBaseUrl from './baseURL';

export const uploadToCloudinary = async (file, type = 'image', folder = 'general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    let endpoint = '';
    if (type === 'image') {
      endpoint = '/api/upload/image';
      formData.append('folder', folder);
    } else if (type === 'audio') {
      endpoint = '/api/upload/audio';
    } else {
      throw new Error('Invalid upload type. Use "image" or "audio"');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      url: data.url,
      publicId: data.publicId,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

