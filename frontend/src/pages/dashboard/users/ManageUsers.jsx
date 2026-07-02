import React, { useState, useMemo } from 'react'
import { useGetAllUsersQuery } from '../../../redux/features/users/usersApi';

const ManageUsers = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const usersPerPage = 10;

    const { data: users = [], isLoading } = useGetAllUsersQuery();

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            (user.username || '').toLowerCase().includes(term) ||
            (user.email || '').toLowerCase().includes(term) ||
            (user.phoneNumber || '').toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    // Pagination calculations
    const totalUsers = filteredUsers?.length || 0;
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers?.slice(indexOfFirstUser, indexOfLastUser) || [];

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading users...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
                        <p className="text-gray-600 mt-1">View and manage all users in your store</p>
                    </div>
                    <div className="bg-indigo-100 px-4 py-2 rounded-lg">
                        <span className="text-indigo-800 font-semibold">{totalUsers} Users</span>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="mt-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by username, email, or phone number..."
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

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Phone Number
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Created At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers && currentUsers.length > 0 ? (
                                currentUsers.map((user, index) => (
                                    <tr key={user._id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {indexOfFirstUser + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {user.username || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {user.email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {user.phoneNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-semibold">{indexOfFirstUser + 1}</span> to{' '}
                            <span className="font-semibold">
                                {indexOfLastUser > totalUsers ? totalUsers : indexOfLastUser}
                            </span>{' '}
                            of <span className="font-semibold">{totalUsers}</span> users
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === 1
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                Previous
                            </button>
                            
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return (
                                            <span key={page} className="px-2 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === totalPages
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManageUsers

