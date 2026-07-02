import React, { useState } from 'react'
import { useForm } from "react-hook-form"
import axios from "axios"
import getBaseUrl from '../utils/baseURL'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle } from "react-icons/fa";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { adminAuth } from "../firebase/firebase.config";

const AdminLogin = () => {
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { register, handleSubmit } = useForm()

      const navigate = useNavigate()

      const persistTokenAndRedirect = (token) => {
        if(token) {
            localStorage.setItem('token', token);
            setTimeout(() => {
                localStorage.removeItem('token')
                alert('Token has been expired!, Please login again.');
                navigate("/")
            }, 8 * 3600 * 1000)
        }
        navigate("/dashboard")
      }

      const loginAdminWithBackend = async ({ email, firebaseId }) => {
        const response =  await axios.post(`${getBaseUrl()}/api/auth/admin/login`, {
            email,
            firebaseId
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        persistTokenAndRedirect(response.data?.token)
      }

      const onSubmit = async (data) => {
        setMessage('')
        setIsSubmitting(true)
        try {
            const credential = await signInWithEmailAndPassword(adminAuth, data.email, data.password);
            const firebaseId = credential?.user?.uid;

            if (!firebaseId) {
                throw new Error('Missing Firebase identifier');
            }

            await loginAdminWithBackend({ email: data.email, firebaseId });

        } catch (error) {
            const backendMessage = error?.response?.data?.message;
            setMessage(backendMessage || "Please provide a valid email and password") 
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
      }

      const handleGoogleSignIn = async () => {
        setMessage('');
        setIsSubmitting(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(adminAuth, provider);
            const email = result.user?.email;
            const firebaseId = result.user?.uid;

            if (!email || !firebaseId) {
                throw new Error('Missing Google account details');
            }

            await loginAdminWithBackend({ email, firebaseId });
        } catch (error) {
            const backendMessage = error?.response?.data?.message;
            setMessage(backendMessage || 'Google sign in failed!');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
      }
  return (
    <div className='h-screen flex justify-center items-center '>
        <div className='w-full max-w-sm mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
            <h2 className='text-xl font-semibold mb-4'>Admin Dashboard Login </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
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
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                    <p className='text-sm text-center text-gray-600'>
                        Need an admin account? <Link to="/admin/register" className='text-blue-500 hover:text-blue-700 font-semibold'>Register</Link>
                    </p>
                    <button 
                        type="button"
                        onClick={handleGoogleSignIn}
                        className='w-full flex flex-wrap gap-1 items-center justify-center bg-secondary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none'>
                        <FaGoogle className='mr-2'/>
                        Sign in with Google
                    </button>
                </div>
            </form>

            <p className='mt-5 text-center text-gray-500 text-xs'>©2025 Book Store. All rights reserved.</p>
        </div>
    </div>
  )
}

export default AdminLogin