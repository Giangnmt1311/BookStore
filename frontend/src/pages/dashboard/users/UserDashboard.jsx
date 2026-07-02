import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmOrderReceiptMutation, useGetOrderByEmailQuery } from '../../../redux/features/orders/ordersApi';
import { 
    useGetUserByEmailQuery, 
    useUpdateUsernameMutation,
    useUpdatePhoneNumberMutation,
    useRemoveFromWishlistMutation,
    useAddAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation
} from '../../../redux/features/users/usersApi';
import { useFetchAllBooksQuery } from '../../../redux/features/books/booksApi';
import { getImgUrl } from '../../../utils/getImgUrl';
import getBaseUrl from '../../../utils/baseURL';
import avatarImg from '../../../assets/avatar.png';
import { FiUser, FiMapPin, FiHeart, FiShoppingBag, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiEdit2, FiCheck, FiX, FiTrash2, FiPlus } from 'react-icons/fi';

const UserDashboard = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const { data: orders = [], isLoading, isError } = useGetOrderByEmailQuery(currentUser?.email);
    const [confirmOrderReceipt, { isLoading: isConfirmingReceipt }] = useConfirmOrderReceiptMutation();
    const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useGetUserByEmailQuery(currentUser?.email || '', { skip: !currentUser?.email });
    const { data: allBooks = [] } = useFetchAllBooksQuery();
    const [updateUsername, { isLoading: isUpdatingUsername }] = useUpdateUsernameMutation();
    const [updatePhoneNumber, { isLoading: isUpdatingPhoneNumber }] = useUpdatePhoneNumberMutation();
    const [removeFromWishlist, { isLoading: isRemovingWishlist }] = useRemoveFromWishlistMutation();
    const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
    const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
    const [deleteAddress, { isLoading: isDeletingAddress }] = useDeleteAddressMutation();
    const [activeTab, setActiveTab] = useState('orders');
    const [expandedOrders, setExpandedOrders] = useState({});
    const [confirmingOrderId, setConfirmingOrderId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameValue, setUsernameValue] = useState('');
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [phoneNumberValue, setPhoneNumberValue] = useState('');
    const [addressForm, setAddressForm] = useState({
        id: null,
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipcode: ''
    });
    const [addressFormMode, setAddressFormMode] = useState('create');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        if (userData?.username) {
            setUsernameValue(userData.username);
        }
        if (userData?.phoneNumber !== undefined) {
            setPhoneNumberValue(userData.phoneNumber || '');
        }
    }, [userData]);

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const navigationItems = [
        { id: 'profile', label: 'User Profile', icon: FiUser },
        { id: 'address', label: 'Address', icon: FiMapPin },
        { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
        { id: 'orders', label: 'My Orders', icon: FiShoppingBag },
    ];

    const unfinishedOrdersCount = useMemo(() => {
        return orders.filter(order => !order.completed).length;
    }, [orders]);

    // Pagination logic
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrders = orders.slice(startIndex, endIndex);

    const getUserName = () => {
        if (userData?.username) return userData.username;
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) {
            const emailPart = currentUser.email.split('@')[0];
            return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
        return 'User';
    };

    const avatarUrl = userData?.avatar || currentUser?.photoURL || avatarImg;

    const handleAvatarClick = () => {
        if (!currentUser?.email) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser?.email) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid file',
                text: 'Please choose an image file for your avatar.',
            });
            event.target.value = '';
            return;
        }

        try {
            setIsUploadingAvatar(true);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(
                `${getBaseUrl()}/api/auth/customers/${encodeURIComponent(currentUser.email)}/avatar`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload avatar');
            }

            await response.json();
            await refetchUser();

            Swal.fire({
                icon: 'success',
                title: 'Avatar updated',
                text: 'Your profile picture has been updated successfully.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload failed',
                text: error.message || 'Could not update avatar. Please try again.',
            });
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = '';
        }
    };

    const handleSaveUsername = async () => {
        if (!currentUser?.email || !usernameValue.trim()) {
            return;
        }
        try {
            await updateUsername({ email: currentUser.email, username: usernameValue.trim() }).unwrap();
            setIsEditingUsername(false);
            refetchUser();
        } catch (error) {
            console.error('Failed to update username:', error);
            alert(error?.data?.message || 'Failed to update username');
        }
    };

    const handleCancelEdit = () => {
        setUsernameValue(userData?.username || '');
        setIsEditingUsername(false);
    };

    const handleSavePhoneNumber = async () => {
        if (!currentUser?.email) {
            return;
        }
        try {
            await updatePhoneNumber({ email: currentUser.email, phoneNumber: phoneNumberValue.trim() }).unwrap();
            setIsEditingPhoneNumber(false);
            refetchUser();
        } catch (error) {
            console.error('Failed to update phone number:', error);
            alert(error?.data?.message || 'Failed to update phone number');
        }
    };

    const handleCancelPhoneEdit = () => {
        setPhoneNumberValue(userData?.phoneNumber || '');
        setIsEditingPhoneNumber(false);
    };

    const getUserEmail = () => {
        return currentUser?.email || '';
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

    const resetAddressForm = () => {
        setAddressForm({
            id: null,
            firstName: '',
            lastName: '',
            street: '',
            city: '',
            state: '',
            country: '',
            zipcode: ''
        });
        setAddressFormMode('create');
    };

    const handleAddressFieldChange = (field, value) => {
        setAddressForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditAddress = (address) => {
        setAddressForm({
            id: address.id,
            firstName: address.firstName || address.label || '',
            lastName: address.lastName || address.recipientName || '',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            country: address.country || '',
            zipcode: address.zipcode || ''
        });
        setAddressFormMode('edit');
    };

    const handleDeleteAddress = async (addressId) => {
        if (!currentUser?.email || !addressId) return;
        try {
            await deleteAddress({ email: currentUser.email, addressId }).unwrap();
            refetchUser();
            if (addressFormMode === 'edit' && addressForm.id === addressId) {
                resetAddressForm();
            }
        } catch (error) {
            console.error('Failed to delete address:', error);
            alert(error?.data?.message || 'Failed to delete address');
        }
    };

    const handleAddressSubmit = async (event) => {
        event.preventDefault();
        if (!currentUser?.email) return;

        const payload = {
            firstName: addressForm.firstName?.trim(),
            lastName: addressForm.lastName?.trim(),
            street: addressForm.street?.trim(),
            city: addressForm.city?.trim(),
            state: addressForm.state?.trim(),
            country: addressForm.country?.trim(),
            zipcode: addressForm.zipcode?.trim()
        };

        try {
            if (addressFormMode === 'edit' && addressForm.id) {
                await updateAddress({
                    email: currentUser.email,
                addressId: addressForm.id,
                    address: payload
                }).unwrap();
            } else {
                await addAddress({
                    email: currentUser.email,
                    address: payload
                }).unwrap();
            }
            refetchUser();
            resetAddressForm();
        } catch (error) {
            console.error('Failed to save address:', error);
            alert(error?.data?.message || 'Failed to save address');
        }
    };

    const wishlistBooks = useMemo(() => {
        if (!userData?.wishlist || userData.wishlist.length === 0) return [];
        return allBooks.filter((book) => userData.wishlist.includes(book._id));
    }, [userData, allBooks]);

    const handleRemoveFromWishlist = async (bookId) => {
        if (!currentUser?.email) return;
        try {
            await removeFromWishlist({ email: currentUser.email, bookId }).unwrap();
            refetchUser();
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
            alert(error?.data?.message || 'Failed to remove item. Please try again.');
        }
    };

    const handleConfirmReceipt = async (orderId) => {
        if (!currentUser?.email || !orderId) return;

        const result = await Swal.fire({
            title: 'Confirm delivery',
            text: 'Have you received this order? We will notify the seller.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (!result.isConfirmed) return;

        try {
            setConfirmingOrderId(orderId);
            await confirmOrderReceipt({ id: orderId, email: currentUser.email }).unwrap();
            Swal.fire({
                title: 'Thanks!',
                text: 'The seller has been notified that you received the order.',
                icon: 'success',
                confirmButtonText: 'Close'
            });
        } catch (error) {
            console.error('Failed to confirm order receipt', error);
            Swal.fire({
                title: 'Unable to confirm',
                text: error?.data?.message || 'Please try again in a moment.',
                icon: 'error',
                confirmButtonText: 'Close'
            });
        } finally {
            setConfirmingOrderId(null);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h2>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {isLoadingUser ? (
                                <div className="text-center py-8">Loading user data...</div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={usernameValue}
                                                onChange={(e) => setUsernameValue(e.target.value)}
                                                disabled={!isEditingUsername}
                                                className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg ${
                                                    isEditingUsername ? 'bg-white' : 'bg-gray-50'
                                                }`}
                                            />
                                            {!isEditingUsername ? (
                                                <button
                                                    onClick={() => setIsEditingUsername(true)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit username"
                                                >
                                                    <FiEdit2 className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveUsername}
                                                        disabled={isUpdatingUsername || !usernameValue.trim()}
                                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save username"
                                                    >
                                                        <FiCheck className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={isUpdatingUsername}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel"
                                                    >
                                                        <FiX className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isUpdatingUsername && (
                                            <p className="text-sm text-gray-500 mt-1">Updating username...</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                value={getUserEmail()}
                                                disabled
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                            <div className="w-9"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="tel"
                                                value={phoneNumberValue}
                                                onChange={(e) => setPhoneNumberValue(e.target.value)}
                                                disabled={!isEditingPhoneNumber}
                                                placeholder="Enter phone number"
                                                className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg ${
                                                    isEditingPhoneNumber ? 'bg-white' : 'bg-gray-50'
                                                }`}
                                            />
                                            {!isEditingPhoneNumber ? (
                                                <button
                                                    onClick={() => setIsEditingPhoneNumber(true)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit phone number"
                                                >
                                                    <FiEdit2 className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSavePhoneNumber}
                                                        disabled={isUpdatingPhoneNumber}
                                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save phone number"
                                                    >
                                                        <FiCheck className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelPhoneEdit}
                                                        disabled={isUpdatingPhoneNumber}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel"
                                                    >
                                                        <FiX className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isUpdatingPhoneNumber && (
                                            <p className="text-sm text-gray-500 mt-1">Updating phone number...</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'address':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Address</h2>
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {addressFormMode === 'edit' ? 'Edit Address' : 'Add New Address'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {addressFormMode === 'edit' ? 'Update the selected address below.' : 'Save frequently used addresses for faster checkout.'}
                                        </p>
                                    </div>
                                    {addressFormMode === 'edit' && (
                                        <button
                                            onClick={resetAddressForm}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            Cancel edit
                                        </button>
                                    )}
                                </div>
                                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddressSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={addressForm.firstName}
                                            onChange={(e) => handleAddressFieldChange('firstName', e.target.value)}
                                            placeholder="First name"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={addressForm.lastName}
                                            onChange={(e) => handleAddressFieldChange('lastName', e.target.value)}
                                            placeholder="Last name"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                        <input
                                            type="text"
                                            value={addressForm.street}
                                            onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                                            placeholder="Street, house number"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={addressForm.city}
                                            onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                                        <input
                                            type="text"
                                            value={addressForm.state}
                                            onChange={(e) => handleAddressFieldChange('state', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={addressForm.country}
                                            onChange={(e) => handleAddressFieldChange('country', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postal Code</label>
                                        <input
                                            type="text"
                                            value={addressForm.zipcode}
                                            onChange={(e) => handleAddressFieldChange('zipcode', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <button
                                            type="submit"
                                            disabled={isAddingAddress || isUpdatingAddress}
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {addressFormMode === 'edit' ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                                            {addressFormMode === 'edit' ? 'Update Address' : 'Save Address'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Saved addresses</h3>
                                </div>

                                {isLoadingUser ? (
                                    <div className="text-center py-8 text-gray-500">Loading addresses...</div>
                                ) : !userData?.addresses?.length ? (
                                    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                                        No saved addresses yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userData.addresses.map((address) => (
                                            <div
                                                key={address.id}
                                                className="border rounded-lg p-4 transition border-gray-200 bg-white"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {address.fullName || [address.firstName, address.lastName].filter(Boolean).join(' ') || 'Full name'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {formatAddress(address)}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => handleEditAddress(address)}
                                                            className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(address.id)}
                                                            disabled={isDeletingAddress}
                                                            className="text-xs px-3 py-1 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'wishlist':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h2>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {isLoadingUser ? (
                                <div className="text-center py-8">Loading wishlist...</div>
                            ) : !wishlistBooks.length ? (
                                <div className="text-center py-8 text-gray-600">
                                    You have no items in your wishlist yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wishlistBooks.map((book) => (
                                        <div key={book._id} className="flex bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition-all overflow-hidden">
                                            <Link to={`/books/${book._id}`} className="w-40 flex-shrink-0">
                                                <img
                                                    src={getImgUrl(book.coverImage)}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </Link>
                                            <div className="flex-1 p-4 flex flex-col">
                                                <div className="flex-1">
                                                    <Link to={`/books/${book._id}`}>
                                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                                                            {book.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                                                        {book.description || 'No description available.'}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>
                                                            <span className="font-semibold text-gray-700">Genre:</span>{' '}
                                                            <span className="italic">{book.genres || 'N/A'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                                                    <div>
                                                        <span className="text-xl font-bold text-green-600">${book.newPrice}</span>
                                                        {book.oldPrice && parseFloat(book.oldPrice) > parseFloat(book.newPrice) && (
                                                            <span className="ml-2 text-sm text-gray-500 line-through">${book.oldPrice}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleRemoveFromWishlist(book._id)}
                                                            disabled={isRemovingWishlist}
                                                            className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Remove from wishlist"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'orders':
            default:
                if (isLoading) return <div className="text-center py-8">Loading...</div>;
                if (isError) return <div className="text-center py-8 text-red-600">Error loading orders data</div>;

    return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders</h2>
                        <p className="text-gray-600 mb-6">Remaining unfinished order{unfinishedOrdersCount !== 1 ? 's' : ''}: {unfinishedOrdersCount}</p>

                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-600">You have no orders yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ORDER ID</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PAYMENT ID</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ADDRESS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {currentOrders.map((order) => (
                                                    <React.Fragment key={order._id}>
                                                        <tr className={`transition-colors ${!order.completed ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}>
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
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {order._id}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                Cash
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {order.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {formatAddress(order.shippingAddress || order.address)}
                                                            </td>
                                                        </tr>
                                                        {expandedOrders[order._id] && (
                                                            <tr>
                                                                <td colSpan="5" className={`px-6 py-4 ${!order.completed ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                                                                    <div className="space-y-2">
                                                                        <p className="text-sm"><span className="font-medium">Email:</span> {order.email}</p>
                                                                        <p className="text-sm"><span className="font-medium">Phone:</span> {order.phoneNumber}</p>
                                                                        <p className="text-sm"><span className="font-medium">Total Price:</span> ${order.totalPrice}</p>
                                                                        <div className="flex flex-wrap gap-2 items-center text-sm">
                                                                            <span className="font-medium">Status:</span>{' '}
                                                                            <span className={`px-2.5 py-0.5 rounded-full w-fit text-xs font-semibold ${order.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                {order.completed ? 'Completed' : 'Not Completed'}
                                                                            </span>
                                                                            {order.buyerConfirmed && (
                                                                            <span className="px-2.5 py-0.5 rounded-full w-fit text-xs font-semibold bg-blue-100 text-blue-700">
                                                                                    Buyer confirmed receipt{order.updatedAt ? ` (${new Date(order.updatedAt).toLocaleDateString()})` : ''}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm"><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                                                                        {order.products && order.products.length > 0 && (
                                                                            <div className="mt-4">
                                                                                <p className="text-sm font-medium mb-3">Products:</p>
                                                                                <div className="space-y-3">
                                                                                    {order.products.map((product, idx) => (
                                                                                        <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
                                                                                            <div className="w-20 h-20 flex-shrink-0">
                                                                                                {product.productId?.coverImage ? (
                                                                                                    <img
                                                                                                        src={getImgUrl(product.productId.coverImage)}
                                                                                                        alt={product.productId?.title || `Product ${idx + 1}`}
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
                                                                                                    {product.productId?.title || product.productId || `Product ${idx + 1}`}
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
                                                                        <div className="mt-4">
                                                                            {!order.buyerConfirmed ? (
                                                                                <button
                                                                                    onClick={() => handleConfirmReceipt(order._id)}
                                                                                    disabled={confirmingOrderId === order._id || isConfirmingReceipt}
                                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                >
                                                                                    {confirmingOrderId === order._id ? 'Confirming...' : 'I have received this order'}
                                                                                </button>
                                                                            ) : (
                                                                                <p className="text-sm text-green-700">
                                                                                    You confirmed receipt{order.updatedAt ? ` on ${new Date(order.updatedAt).toLocaleDateString()}` : ''}.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-4">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex + 1} - {Math.min(endIndex, orders.length)} of {orders.length} order{orders.length !== 1 ? 's' : ''}
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
                                                                    ? 'bg-blue-600 text-white border-blue-600'
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
                                )}
                            </>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {/* Profile Section */}
                            <div className="text-center mb-6 pb-6 border-b border-gray-200">
                                <div className="relative w-20 h-20 mx-auto mb-3">
                                    <button
                                        type="button"
                                        onClick={handleAvatarClick}
                                        className="group w-full h-full rounded-full overflow-hidden ring-2 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Click to change avatar"
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition-opacity">
                                            {isUploadingAvatar ? 'Uploading...' : 'Change'}
                                        </div>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{getUserName()}</h3>
                                <p className="text-sm text-gray-600 mt-1">{getUserEmail()}</p>
                                {isUploadingAvatar && (
                                    <p className="mt-2 text-xs text-gray-500">Uploading avatar...</p>
                                )}
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                {navigationItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
