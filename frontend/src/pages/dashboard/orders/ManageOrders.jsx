import React, { useState, useEffect, useMemo } from 'react'
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation, useDeleteOrderMutation } from '../../../redux/features/orders/ordersApi'
import Swal from 'sweetalert2';
import { FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImgUrl } from '../../../utils/getImgUrl';

const ManageOrders = () => {
  const { data: orders = [], isLoading, isError } = useGetAllOrdersQuery();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const [expandedOrders, setExpandedOrders] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') {
      const trimmed = address.trim();
      return trimmed.length ? trimmed : 'N/A';
    }
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.zipcode) parts.push(address.zipcode);
    return parts.join(', ') || 'N/A';
  };

  const handleToggle = async (order) => {
    try {
      await updateStatus({ id: order._id, completed: !order.completed }).unwrap();
    } catch (e) {
      alert('Failed to update order status');
    }
  }

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      (order._id || '').toLowerCase().includes(term) ||
      (order.name || '').toLowerCase().includes(term) ||
      (order.email || '').toLowerCase().includes(term) ||
      ((order.completed ? 'completed' : 'pending')).includes(term)
    );
  }, [orders, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Orders</h2>
            <p className="text-gray-600 mt-1">View and manage all customer orders</p>
          </div>
          <div className="bg-indigo-100 px-4 py-2 rounded-lg">
            <span className="text-indigo-800 font-semibold">{filteredOrders?.length || 0} Orders</span>
          </div>
        </div>
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, or status..."
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

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-red-600 font-medium">Failed to load orders. Please try again.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-12">
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders && filteredOrders.length > 0 ? (
                  currentOrders.map((order, idx) => (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleOrderExpansion(order._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {expandedOrders[order._id] ? (
                              <FiChevronUp className="w-5 h-5" />
                            ) : (
                              <FiChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {startIndex + idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {order._id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{order.name}</div>
                          <div className="text-sm text-gray-500">{order.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${order.totalPrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-0.5 inline-flex w-fit text-xs leading-5 font-semibold rounded-full ${
                              order.completed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.completed ? 'Completed' : 'Pending'}
                            </span>
                            {order.buyerConfirmed && (
                              <span className="px-2.5 py-0.5 inline-flex w-fit text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Buyer confirmed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleToggle(order)} 
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                          >
                            Mark as {order.completed ? 'Pending' : 'Completed'}
                          </button>
                          <button 
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Are you sure?',
                                text: "You won't be able to revert this!",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'Yes, delete it'
                              });

                              if (result.isConfirmed) {
                                try {
                                  await deleteOrder(order._id).unwrap();
                                  Swal.fire({
                                    title: 'Deleted!',
                                    text: 'Order has been deleted successfully.',
                                    icon: 'success',
                                    confirmButtonText: 'OK'
                                  });
                                } catch {
                                  Swal.fire({
                                    title: 'Error!',
                                    text: 'Failed to delete order',
                                    icon: 'error',
                                    confirmButtonText: 'OK'
                                  });
                                }
                              }
                            }} 
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedOrders[order._id] && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <p className="text-sm"><span className="font-medium">Full Order ID:</span> {order._id}</p>
                              <p className="text-sm"><span className="font-medium">Full Name:</span> {order.name}</p>
                              <p className="text-sm"><span className="font-medium">Email:</span> {order.email}</p>
                              <p className="text-sm"><span className="font-medium">Phone:</span> {order.phoneNumber || 'N/A'}</p>
                              <p className="text-sm"><span className="font-medium">Shipping Address:</span> {formatAddress(order.shippingAddress || order.address)}</p>
                              <p className="text-sm"><span className="font-medium">Total Price:</span> ${order.totalPrice}</p>
                              <div className="text-sm space-y-1">
                                <p>
                                  <span className="font-medium">Status:</span>{' '}
                                  <span className={order.completed ? 'text-green-600' : 'text-yellow-600'}>
                                    {order.completed ? 'Completed' : 'Pending'}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium">Buyer confirmation:</span>{' '}
                                  {order.buyerConfirmed ? (
                                    <span className="text-blue-600">
                                      Confirmed {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">Not yet</span>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm"><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                              {order.products && order.products.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-3">Products:</p>
                                  <div className="space-y-3">
                                    {order.products.map((product, productIdx) => (
                                      <div key={productIdx} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="w-20 h-20 flex-shrink-0">
                                          {product.productId?.coverImage ? (
                                            <img
                                              src={getImgUrl(product.productId.coverImage)}
                                              alt={product.productId?.title || `Product ${productIdx + 1}`}
                                              className="w-full h-full object-cover rounded"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                              <span className="text-xs text-gray-500">No Image</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {product.productId?.title || product.productId || `Product ${productIdx + 1}`}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Price: ${product.price || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                          <p className="text-sm font-medium text-gray-700">
                                            {product.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No orders found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredOrders && filteredOrders.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <span className="sr-only">Previous page</span>
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <span className="sr-only">Next page</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageOrders


