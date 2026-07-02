import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import getBaseUrl from '../../utils/baseURL';

const SellerProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    businessName: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError('Missing authentication token. Please login again.');
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${getBaseUrl()}/api/auth/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setFormData({
          fullName: data?.admin?.fullName || '',
          phoneNumber: data?.admin?.phoneNumber || '',
          businessName: data?.admin?.businessName || '',
        });
        setError('');
      } catch (err) {
        console.error('Failed to fetch seller profile', err);
        setError(err?.response?.data?.message || 'Failed to load seller profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      Swal.fire({
        title: 'Please login',
        text: 'Your session has expired. Please login again to update your profile.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (!formData.fullName.trim() || !formData.phoneNumber.trim() || !formData.businessName.trim()) {
      Swal.fire({
        title: 'Missing details',
        text: 'Full name, phone number, and store name are required.',
        icon: 'info',
        confirmButtonText: 'Got it',
      });
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await axios.put(
        `${getBaseUrl()}/api/auth/admin/profile`,
        {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          businessName: formData.businessName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setFormData({
        fullName: data?.admin?.fullName || '',
        phoneNumber: data?.admin?.phoneNumber || '',
        businessName: data?.admin?.businessName || '',
      });
      Swal.fire({
        title: 'Profile updated',
        text: 'Your seller information was saved successfully.',
        icon: 'success',
        confirmButtonText: 'Close',
      });
    } catch (err) {
      console.error('Failed to update seller profile', err);
      Swal.fire({
        title: 'Update failed',
        text: err?.response?.data?.message || 'Unable to update your profile right now.',
        icon: 'error',
        confirmButtonText: 'Close',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading seller information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Seller profile</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your name"
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phoneNumber">
            Phone number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter a phone number"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="businessName">
            Store name
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your store name"
          />
        </div>

        <div className="col-span-1 md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerProfile;

