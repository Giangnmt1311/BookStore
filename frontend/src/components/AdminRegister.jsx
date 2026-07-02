import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import getBaseUrl from '../utils/baseURL'
import { useAuth } from '../context/AuthContext'

const AdminRegister = () => {
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { register, handleSubmit } = useForm()
    const { registerUser } = useAuth();
    const navigate = useNavigate()

    const persistTokenAndRedirect = (token) => {
        if (token) {
            localStorage.setItem('token', token)
            setTimeout(() => {
                localStorage.removeItem('token')
                alert('Token has been expired!, Please login again.')
                navigate("/")
            }, 8 * 3600 * 1000)
        }
        navigate('/dashboard')
    }

    const onSubmit = async (data) => {
        setMessage('')
        setIsSubmitting(true)
        try {
            const credential = await registerUser(data.email, data.password)
            const firebaseId = credential?.user?.uid

            if (!firebaseId) {
                throw new Error('Missing Firebase identifier')
            }

            const response = await axios.post(`${getBaseUrl()}/api/auth/admin/register`, {
                businessName: data.businessName,
                email: data.email,
                firebaseId,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            persistTokenAndRedirect(response.data?.token)
        } catch (error) {
            const backendMessage = error?.response?.data?.message
            setMessage(backendMessage || 'Unable to register admin. Please check the details and try again.')
            console.error('Admin registration failed', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='h-screen flex justify-center items-center '>
            <div className='w-full max-w-sm mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
                <h2 className='text-xl font-semibold mb-4'>Create Admin Account</h2>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor="fullName">Full Name</label>
                        <input
                            {...register("fullName", { required: true })}
                            type="text" name="fullName" id="fullName" placeholder='Your full name'
                            className='shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor="phoneNumber">Phone Number</label>
                        <input
                            {...register("phoneNumber", { required: true })}
                            type="tel" name="phoneNumber" id="phoneNumber" placeholder='Phone number'
                            className='shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor="businessName">Store Name</label>
                        <input
                            {...register("businessName", { required: true })}
                            type="text" name="businessName" id="businessName" placeholder='Store name'
                            className='shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor="email">Email</label>
                        <input
                            {...register("email", { required: true })}
                            type="email" name="email" id="email" placeholder='Email address'
                            className='shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow'
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor="password">Password</label>
                        <input
                            {...register("password", { required: true })}
                            type="password" name="password" id="password" placeholder='Password'
                            className='shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow'
                        />
                    </div>
                    {
                        message && <p className='text-red-500 text-xs italic mb-3'>{message}</p>
                    }
                    <div className='w-full space-y-3'>
                        <button
                            disabled={isSubmitting}
                            className='bg-blue-500 w-full hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 px-8 rounded focus:outline-none'>
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </button>
                        <p className='text-sm text-center text-gray-600'>
                            Already have access? <Link to="/admin" className='text-blue-500 hover:text-blue-700 font-semibold'>Login</Link>
                        </p>
                    </div>
                </form>

                <p className='mt-5 text-center text-gray-500 text-xs'>©2025 Book Store. All rights reserved.</p>
            </div>
        </div>
    )
}

export default AdminRegister

