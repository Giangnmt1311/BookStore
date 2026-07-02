import React, { useEffect, useState } from 'react'
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../../components/ChatWidget';
import getBaseUrl from '../../utils/baseURL';

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isManageBooksOpen, setIsManageBooksOpen] = useState(false)
  const [isManageBannersOpen, setIsManageBannersOpen] = useState(false)
  const [isManageAuthorsOpen, setIsManageAuthorsOpen] = useState(false)
  const [isManageGenresOpen, setIsManageGenresOpen] = useState(false)
  const [sellerName, setSellerName] = useState('Seller')
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const fetchSellerProfile = async () => {
      try {
        const { data } = await axios.get(`${getBaseUrl()}/api/auth/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (data?.admin?.fullName) {
          setSellerName(data.admin.fullName);
        }
      } catch (error) {
        console.error('Failed to fetch seller profile', error);
      }
    };

    fetchSellerProfile();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/dashboard/manage-books') || 
        location.pathname.includes('/dashboard/add-new-book') ||
        location.pathname.includes('/dashboard/edit-book')) {
      setIsManageBooksOpen(true);
    }
    if (location.pathname.includes('/dashboard/manage-authors') ||
        location.pathname.includes('/dashboard/add-author') ||
        location.pathname.includes('/dashboard/edit-author')) {
      setIsManageAuthorsOpen(true);
    }
    if (location.pathname.includes('/dashboard/manage-genres') ||
        location.pathname.includes('/dashboard/add-genre') ||
        location.pathname.includes('/dashboard/edit-genre')) {
      setIsManageGenresOpen(true);
    }
    if (location.pathname.includes('/dashboard/manage-banners') || 
        location.pathname.includes('/dashboard/add-banner') ||
        location.pathname.includes('/dashboard/edit-banner')) {
      setIsManageBannersOpen(true);
    }
  }, [location.pathname]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/")
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isManageBooksActive = () => {
    return isActive('/dashboard/manage-books') || 
           isActive('/dashboard/add-new-book') ||
           isActive('/dashboard/edit-book')
  }

  const isManageAuthorsActive = () => {
    return isActive('/dashboard/manage-authors') ||
           isActive('/dashboard/add-author') ||
           isActive('/dashboard/edit-author')
  }

  const isManageGenresActive = () => {
    return isActive('/dashboard/manage-genres') ||
           isActive('/dashboard/add-genre') ||
           isActive('/dashboard/edit-genre')
  }

  const isManageBannersActive = () => {
    return isActive('/dashboard/manage-banners') || 
           isActive('/dashboard/add-banner') ||
           isActive('/dashboard/edit-banner')
  }

  return (
    <section className="flex bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="px-6 py-8 border-b border-indigo-700">
            <h2 className="text-2xl font-bold text-white mb-1">Admin Panel</h2>
            <p className="text-indigo-300 text-sm">Book Store Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Dashboard Link */}
            <Link 
              to="/dashboard" 
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                location.pathname === '/dashboard'
                  ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Manage Books Dropdown */}
            <div>
              <button
                onClick={() => setIsManageBooksOpen(!isManageBooksOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isManageBooksActive()
                    ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <span className="font-medium">Manage Books</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isManageBooksOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isManageBooksOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/dashboard/add-new-book"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/add-new-book')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">Add New Book</span>
                  </Link>
                  <Link
                    to="/dashboard/manage-books"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/manage-books')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">View All Books</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Manage Authors Dropdown */}
            <div>
              <button
                onClick={() => setIsManageAuthorsOpen(!isManageAuthorsOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isManageAuthorsActive()
                    ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <span className="font-medium">Manage Authors</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isManageAuthorsOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isManageAuthorsOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/dashboard/add-author"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/add-author')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">Add New Author</span>
                  </Link>
                  <Link
                    to="/dashboard/manage-authors"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/manage-authors') || isActive('/dashboard/edit-author')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">View All Authors</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Manage Genres Dropdown */}
            <div>
              <button
                onClick={() => setIsManageGenresOpen(!isManageGenresOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isManageGenresActive()
                    ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <span className="font-medium">Manage Genres</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isManageGenresOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isManageGenresOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/dashboard/add-genre"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/add-genre')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">Add New Genre</span>
                  </Link>
                  <Link
                    to="/dashboard/manage-genres"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/manage-genres') || isActive('/dashboard/edit-genre')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">View All Genres</span>
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              to="/dashboard/manage-orders" 
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive('/dashboard/manage-orders')
                  ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <span className="font-medium">Manage Orders</span>
            </Link>

            <Link 
              to="/dashboard/manage-users" 
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive('/dashboard/manage-users')
                  ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <span className="font-medium">Manage Users</span>
            </Link>

            <Link 
              to="/dashboard/profile" 
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive('/dashboard/profile')
                  ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <span className="font-medium">Seller Profile</span>
            </Link>

            {/* Manage Banners Dropdown */}
            <div>
              <button
                onClick={() => setIsManageBannersOpen(!isManageBannersOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isManageBannersActive()
                    ? 'bg-white text-indigo-900 shadow-lg font-semibold'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <span className="font-medium">Manage Banners</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isManageBannersOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isManageBannersOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/dashboard/add-banner"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/add-banner')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">Add New Banner</span>
                  </Link>
                  <Link
                    to="/dashboard/manage-banners"
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive('/dashboard/manage-banners')
                        ? 'bg-indigo-800 text-white font-semibold'
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">View All Banners</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="flex items-center justify-between h-20 px-6 sm:px-10">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-indigo-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {sellerName?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="font-semibold text-gray-700 hidden sm:inline">
                  {sellerName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-600 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet/>
          </div>
        </main>
      </div>
      
      {/* Chat Widget for Admin */}
      <ChatWidget />
    </section>
  )
}

export default DashboardLayout