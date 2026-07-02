import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGetUserByEmailQuery } from '../../redux/features/users/usersApi';
import { getSelectedAddressId, setSelectedAddressId } from '../../utils/checkoutStorage';

const AddressSelection = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { data: userData, isLoading, isFetching } = useGetUserByEmailQuery(currentUser?.email || '', {
        skip: !currentUser?.email
    });
    const [selectedId, setSelectedId] = useState(getSelectedAddressId());

    const addresses = userData?.addresses || [];

    const fallbackAddress = useMemo(() => {
        if (!addresses.length) return null;
        return addresses.find((addr) => addr.isDefault) || addresses[0];
    }, [addresses]);

    useEffect(() => {
        if (!addresses.length) {
            setSelectedId(null);
            return;
        }

        if (selectedId && addresses.some((addr) => addr.id === selectedId)) {
            return;
        }

        if (fallbackAddress?.id) {
            setSelectedId(fallbackAddress.id);
        }
    }, [addresses, fallbackAddress, selectedId]);

    const handleProceed = () => {
        if (!selectedId) {
            alert('Please select an address to continue.');
            return;
        }
        setSelectedAddressId(selectedId);
        navigate('/checkout');
    };

    const handleManageAddresses = () => {
        navigate('/user-dashboard', { state: { activeTab: 'address' } });
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Please sign in to select an address.</p>
            </div>
        );
    }

    return (
        <section className="bg-gray-50 py-10 pb-16">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Choose delivery address</h1>
                        <p className="text-gray-500 mt-1">Select the address we should use for this order.</p>
                    </div>
                    <button
                        onClick={handleManageAddresses}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                        Manage addresses
                    </button>
                </div>

                {isLoading || isFetching ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                        Loading your addresses...
                    </div>
                ) : !addresses.length ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p className="text-gray-600 mb-4">You don’t have any saved addresses yet.</p>
                        <button
                            onClick={handleManageAddresses}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Add an address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address) => {
                            const isSelected = selectedId === address.id;
                            return (
                                <label
                                    key={address.id}
                                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-xl p-4 cursor-pointer transition ${
                                        isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="selectedAddress"
                                            value={address.id}
                                            checked={isSelected}
                                            onChange={() => setSelectedId(address.id)}
                                            className="mt-1 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {address.fullName || [address.firstName, address.lastName].filter(Boolean).join(' ')}
                                                </p>
                                                {address.isDefault && (
                                                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {address.street}, {address.city}{address.state ? `, ${address.state}` : ''}, {address.country}
                                                {address.zipcode ? `, ${address.zipcode}` : ''}
                                            </p>
                                            {address.phone && <p className="text-sm text-gray-500 mt-1">{address.phone}</p>}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => navigate('/cart')}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Back to cart
                            </button>
                            <button
                                onClick={handleProceed}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                                disabled={!selectedId}
                            >
                                Continue to checkout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AddressSelection;

