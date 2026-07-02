import React, { useState, useMemo } from 'react'
import { useDeleteAuthorMutation, useFetchAllAuthorsQuery } from '../../../redux/features/authors/authorsApi';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ManageAuthors = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const authorsPerPage = 10;

    const {data: authors, refetch} = useFetchAllAuthorsQuery()

    const [deleteAuthor] = useDeleteAuthorMutation()

    const handleDeleteAuthor = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes'
        });

        if (!result.isConfirmed) {
            return;
        }
        
        try {
            await deleteAuthor(id).unwrap();
            Swal.fire({
                title: 'Deleted!',
                text: 'Author has been deleted successfully.',
                icon: 'success',
                confirmButtonText: 'Yes'
            });
            refetch();
            const remainingAuthors = (filteredAuthors?.length || 0) - 1;
            const maxPage = Math.ceil(remainingAuthors / authorsPerPage);
            if (currentPage > maxPage && maxPage > 0) {
                setCurrentPage(maxPage);
            }
        } catch (error) {
            console.error('Failed to delete author:', error);
            const errorMessage = error?.data?.message || error?.message || 'Failed to delete author. Please try again.';
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Yes'
            });
        }
    };

    const handleEditClick = (id) => {
        navigate(`/dashboard/edit-author/${id}`);
    };

    const filteredAuthors = useMemo(() => {
        if (!searchTerm.trim()) return authors || [];
        const term = searchTerm.toLowerCase();
        return (authors || []).filter(author => 
            (author.name || '').toLowerCase().includes(term)
        );
    }, [authors, searchTerm]);

    // Pagination
    const totalAuthors = filteredAuthors?.length || 0;
    const totalPages = Math.ceil(totalAuthors / authorsPerPage);
    const indexOfLastAuthor = currentPage * authorsPerPage;
    const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
    const currentAuthors = filteredAuthors?.slice(indexOfFirstAuthor, indexOfLastAuthor) || [];

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Authors</h2>
            <p className="text-gray-600 mt-1">View and manage all authors in your store</p>
          </div>
          <div className="bg-indigo-100 px-4 py-2 rounded-lg">
            <span className="text-indigo-800 font-semibold">{totalAuthors} Authors</span>
          </div>
        </div>
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by author name..."
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

      {/* Authors Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Author Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAuthors && currentAuthors.length > 0 ? (
                currentAuthors.map((author, index) => (
                  <tr key={author._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {indexOfFirstAuthor + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {author.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link 
                        to={`/dashboard/edit-author/${author._id}`} 
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDeleteAuthor(author._id)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No authors found. Add your first author to get started!
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
              Showing <span className="font-semibold">{indexOfFirstAuthor + 1}</span> to{' '}
              <span className="font-semibold">
                {indexOfLastAuthor > totalAuthors ? totalAuthors : indexOfLastAuthor}
              </span>{' '}
              of <span className="font-semibold">{totalAuthors}</span> authors
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

export default ManageAuthors

