import React, { useState, useMemo } from 'react';
import { useFetchAllBannersQuery, useDeleteBannerMutation } from '../../../redux/features/banners/bannersApi';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const ManageBanners = () => {
    const { data: banners, refetch } = useFetchAllBannersQuery();
    const [deleteBanner] = useDeleteBannerMutation();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBanners = useMemo(() => {
        if (!searchTerm.trim()) return banners || [];
        const term = searchTerm.toLowerCase();
        return (banners || []).filter(banner => 
            (banner.title || '').toLowerCase().includes(term)
        );
    }, [banners, searchTerm]);

    const handleDeleteBanner = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes'
        });

        if (result.isConfirmed) {
            try {
                await deleteBanner(id).unwrap();
                Swal.fire(
                    'Deleted!',
                    'Your banner has been deleted.',
                    'success'
                );
                refetch();
            } catch (error) {
                Swal.fire(
                    'Error!',
                    'Failed to delete banner.',
                    'error'
                );
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Banners</h2>
                        <p className="text-gray-600 mt-1">View and manage all banners</p>
                    </div>
                    <div className="bg-indigo-100 px-4 py-2 rounded-lg">
                        <span className="text-indigo-800 font-semibold">{filteredBanners?.length || 0} Banners</span>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="mt-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by banner title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Display Order</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBanners && filteredBanners.length > 0 ? (
                                filteredBanners.map((banner, index) => (
                                <tr key={banner._id}>
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4">{banner.title}</td>
                                    <td className="px-6 py-4">{banner.displayOrder || 0}</td>
                                    <td className="px-6 py-4">{banner.isActive ? 'Active' : 'Inactive'}</td>
                                    <td className="px-6 py-4 space-x-3">
                                        <Link to={`/dashboard/edit-banner/${banner._id}`} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Edit</Link>
                                        <button onClick={() => handleDeleteBanner(banner._id)} className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No banners found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageBanners;
