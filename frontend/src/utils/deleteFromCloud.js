import getBaseUrl from './baseURL';
export const deleteFromCloudinary = async (url, resourceType = 'image') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${getBaseUrl()}/api/upload/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url, resourceType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Delete failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

