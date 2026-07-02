import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from "react-hook-form"
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useGetUserByEmailQuery } from '../../redux/features/users/usersApi';

import Swal from'sweetalert2';
import { useCreateOrderMutation } from '../../redux/features/orders/ordersApi';
import { clearCart } from '../../redux/features/cart/cartSlice';
import getBaseUrl from '../../utils/baseURL';
import { getSelectedAddressId, clearSelectedAddressId } from '../../utils/checkoutStorage';

const CheckoutPage = () => {
    const cartItems = useSelector(state => state.cart.cartItems);
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.newPrice * (item.quantity || 1)), 0).toFixed(2);
    const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const {  currentUser} = useAuth()

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm()

    const [createOrder, {isLoading, error}] = useCreateOrderMutation();
    const { data: userProfile, isLoading: isLoadingProfile } = useGetUserByEmailQuery(currentUser?.email || '', { skip: !currentUser?.email });
    const resolvedUserId = userProfile?.id || null;
    const navigate =  useNavigate()
    const dispatch = useDispatch();

    const [isChecked, setIsChecked] = useState(false)
    const [selectedAddressId, setSelectedAddressId] = useState(() => getSelectedAddressId());

    const selectedAddress = useMemo(() => {
        if (!userProfile?.addresses || !userProfile.addresses.length) return null;
        if (selectedAddressId) {
            const found = userProfile.addresses.find((addr) => addr.id === selectedAddressId);
            if (found) return found;
        }
        return userProfile.addresses.find((addr) => addr.isDefault) || userProfile.addresses[0];
    }, [selectedAddressId, userProfile]);

    useEffect(() => {
        if (!userProfile?.addresses || !userProfile.addresses.length) return;
        if (!selectedAddressId) {
            const fallback = userProfile.addresses.find((addr) => addr.isDefault) || userProfile.addresses[0];
            if (fallback?.id) {
                setSelectedAddressId(fallback.id);
            }
        } else {
            const exists = userProfile.addresses.some((addr) => addr.id === selectedAddressId);
            if (!exists) {
                const fallback = userProfile.addresses.find((addr) => addr.isDefault) || userProfile.addresses[0];
                setSelectedAddressId(fallback?.id || null);
            }
        }
    }, [userProfile, selectedAddressId]);

    useEffect(() => {
        if (!selectedAddress) return;
        const fullName = selectedAddress.fullName || [selectedAddress.firstName, selectedAddress.lastName].filter(Boolean).join(' ');
        if (fullName) setValue('name', fullName);
        if (selectedAddress.street) setValue('address', selectedAddress.street);
        if (selectedAddress.city) setValue('city', selectedAddress.city);
        if (selectedAddress.state) setValue('state', selectedAddress.state);
        if (selectedAddress.country) setValue('country', selectedAddress.country);
        if (selectedAddress.zipcode) setValue('zipcode', selectedAddress.zipcode);
    }, [selectedAddress, setValue]);

    useEffect(() => {
        if (userProfile?.phoneNumber) {
            setValue('phone', userProfile.phoneNumber);
        }
    }, [userProfile?.phoneNumber, setValue]);

    const logOrderInteractions = async (items = []) => {
        if (!items.length || !resolvedUserId) return;

        const payloads = items
            .filter(item => item?._id)
            .map(item => ({
                userId: resolvedUserId,
                bookId: item._id,
                interactionType: 'order'
            }));

        await Promise.all(payloads.map(body => 
            fetch(`${getBaseUrl()}/api/interactions/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }).catch(err => console.error('Failed to log order interaction:', err))
        ));
    };
    const buildShippingAddress = (data) => {
        const parts = [
            data.address,
            data.city,
            data.state,
            data.country,
            data.zipcode
        ];
        return parts.filter(Boolean).join(', ');
    };

    const onSubmit = async (data) => {
        if (!resolvedUserId) {
            Swal.fire({
                title: "Not signed in",
                text: "Please log in before placing an order.",
                icon: "warning",
                confirmButtonText: "OK"
            });
            return;
        }

        if (!cartItems.length || totalItems === 0) {
            Swal.fire({
                title: "Empty Cart",
                text: "Please add products to your cart before placing an order.",
                icon: "warning",
                confirmButtonText: "OK"
            });
            return;
        }

        const shippingAddress = buildShippingAddress(data);
        const newOrder = {
            userId: resolvedUserId,
            name: data.name,
            email: currentUser?.email,
            shippingAddress,
            phoneNumber: data.phone,
            products: cartItems.map(item => ({
                productId: item._id,
                quantity: item.quantity || 1,
                price: item.newPrice
            })),
            totalPrice: totalPrice,
        }
        
        try {
            await createOrder(newOrder).unwrap();
            await logOrderInteractions(cartItems);
            dispatch(clearCart());
            clearSelectedAddressId();
            Swal.fire({
                title: "Confirmed Order",
                text: "Your order placed successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, It's Okay!"
              });
              navigate("/user-dashboard")
        } catch (error) {
            console.error("Error place an order", error);
            alert("Failed to place an order")
        }
    }

    const isAddressLocked = Boolean(selectedAddress);

    if(isLoading || isLoadingProfile) return <div>Loading....</div>
    
    if(!cartItems.length || totalItems === 0) {
        return (
            <div className="bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FiShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                        <p className="text-gray-600 mb-6">Start adding some books to your cart!</p>
                        <Link
                            to="/"
                            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                            Browse Books
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
    
    if(!userProfile?.addresses?.length) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add a delivery address first</h2>
                <p className="text-gray-600 mb-6">Please save at least one address before completing checkout.</p>
                <div className="flex gap-4">
                    <Link to="/checkout/address" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Choose address</Link>
                    <Link to="/user-dashboard" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Manage addresses</Link>
                </div>
            </div>
        )
    }

    return (
        <section>
            <div className="min-h-screen p-6 bg-gray-100 flex items-center justify-center">
                <div className="container max-w-screen-lg mx-auto">
                    <div>
                        <div>
                            <h2 className="font-semibold text-2xl text-gray-900 mb-1">Checkout</h2>
                            <p className="text-3xl font-bold text-blue-700 mb-6">Total: ${totalPrice}</p>
                        </div>
                        
                            <div className="bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6">
                                {selectedAddress && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{selectedAddress.fullName || [selectedAddress.firstName, selectedAddress.lastName].filter(Boolean).join(' ')}</p>
                                            <p className="text-sm text-gray-600">
                                                {selectedAddress.street}, {selectedAddress.city}{selectedAddress.state ? `, ${selectedAddress.state}` : ''}, {selectedAddress.country}{selectedAddress.zipcode ? `, ${selectedAddress.zipcode}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/checkout/address')}
                                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                                        >
                                            Change address
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3 my-8">
                                    <div className="text-gray-600">
                                        <p className="font-medium text-lg">Personal Details</p>
                                        <p>Details are locked to your selected address.</p>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
                                            <div className="md:col-span-5">
                                                <label htmlFor="full_name">Full Name</label>
                                                <input
                                                    {...register("name", { required: true })}
                                                    type="text" name="name" id="name"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} />
                                            </div>

                                            <div className="md:col-span-5">
                                                <label html="email">Email Address</label>
                                                <input

                                                    type="text" name="email" id="email" className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                                                    disabled
                                                    defaultValue={currentUser?.email}
                                                    placeholder="email@domain.com" />
                                            </div>
                                            <div className="md:col-span-5">
                                                <label html="phone">Phone Number</label>
                                                <input
                                                    {...register("phone", { required: true })}
                                                    type="text" name="phone" id="phone"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} placeholder="+123 456 7890" />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label htmlFor="address">Address / Street</label>
                                                <input
                                                    {...register("address", { required: true })}
                                                    type="text" name="address" id="address"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} placeholder="" />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="city">City</label>
                                                <input
                                                    {...register("city", { required: true })}
                                                    type="text" name="city" id="city"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} placeholder="" />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="country">Country / region</label>
                                                <input
                                                    {...register("country", { required: true })}
                                                    name="country" id="country" placeholder="Country"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="state">State / province</label>
                                                <input
                                                    {...register("state", { required: true })}
                                                    name="state" id="state" placeholder="State"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label htmlFor="zipcode">Zipcode</label>
                                                <input
                                                    {...register("zipcode", { required: true })}
                                                    type="text" name="zipcode" id="zipcode"
                                                    disabled={isAddressLocked}
                                                    readOnly={isAddressLocked}
                                                    className={`transition-all flex items-center h-10 border mt-1 rounded px-4 w-full ${isAddressLocked ? 'bg-gray-50' : 'bg-white'}`} placeholder="" />
                                            </div>

                                            <div className="md:col-span-5 mt-3">
                                                <div className="inline-flex items-center">
                                                    <input
                                                        onChange={(e) => setIsChecked(e.target.checked)}
                                                        type="checkbox" name="billing_same" id="billing_same" className="form-checkbox" />
                                                    <label htmlFor="billing_same" className="ml-2 ">I agree to the <Link className='underline underline-offset-2 text-blue-600'>Terms & Conditions</Link> and <Link className='underline underline-offset-2 text-blue-600'>Shopping Policy.</Link></label>
                                                </div>
                                            </div>



                                            <div className="md:col-span-5 text-right">
                                                <div className="inline-flex items-end">
                                                    <button
                                                        disabled={!isChecked || !cartItems.length || totalItems === 0}
                                                        className={`font-bold py-2 px-4 rounded ${
                                                            !isChecked || !cartItems.length || totalItems === 0
                                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                                                        }`}>
                                                        Place an Order
                                                    </button>
                                                </div>
                                                {(!cartItems.length || totalItems === 0) && (
                                                    <p className="text-sm text-red-600 mt-2 text-right">Please add products to your cart before placing an order</p>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </form>
                            </div>                        
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CheckoutPage