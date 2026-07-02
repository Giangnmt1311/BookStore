import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa"
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi"

const Footer = () => {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">About BookStore</h3>
            <p className="text-sm leading-relaxed mb-4">
              Your trusted online bookstore for the latest bestsellers, classics, and hidden gems. 
              Discover your next favorite read today.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-blue-500 transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-pink-500 transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-red-500 transition-colors">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/books" className="text-sm hover:text-white transition-colors">All Books</Link>
              </li>
              <li>
                <Link to="/books?genre=best-sellers" className="text-sm hover:text-white transition-colors">Best Sellers</Link>
              </li>
              <li>
                <Link to="/books?genre=new-releases" className="text-sm hover:text-white transition-colors">New Releases</Link>
              </li>
              <li>
                <Link 
                  to={{ pathname: "/user-dashboard", state: { activeTab: 'orders' } }} 
                  className="text-sm hover:text-white transition-colors"
                >
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Shipping Info</Link>
              </li>
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Returns & Exchanges</Link>
              </li>
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-sm mb-4">
              Subscribe to get special offers and new releases delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} BookStore. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-gray-600">|</span>
              <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-gray-600">|</span>
              <Link to="/" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer