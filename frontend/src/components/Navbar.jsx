import { Link, useNavigate } from "react-router-dom";
import { HiOutlineHome, HiOutlineShoppingCart } from "react-icons/hi2";
import { IoSearchOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { HiOutlineUser } from "react-icons/hi";
import { FiChevronDown, FiBook, FiHeart, FiZap, FiTrendingUp, FiGlobe, FiUsers, FiTag, FiAward, FiStar, FiCalendar } from "react-icons/fi";

import avatarImg from "../assets/avatar.png"
import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { useGetUserByEmailQuery } from "../redux/features/users/usersApi";
import { useFetchAllGenresQuery } from "../redux/features/genres/genresApi";

const navigation = [
    {name: "Dashboard", href:"/user-dashboard"},
    {name: "Check Out", href:"/checkout"},
]

const specialCategories = [
    { name: "Best Sellers", icon: FiStar, href: "/books?genre=best-sellers" },
    { name: "New Releases", icon: FiCalendar, href: "/books?genre=new-releases" },
];

const getGenreIcon = (genreName) => {
    const iconMap = {
        'fiction': FiBook,
        'romance': FiHeart,
        'mystery': FiZap,
        'business': FiTrendingUp,
        'technology': FiGlobe,
        'adventure': FiUsers,
        'horror': FiAward,
    };
    const normalizedName = genreName.toLowerCase();
    return iconMap[normalizedName] || FiBook;
};

const genreToSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
};

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [query, setQuery] = useState("")
    const navigate = useNavigate()
    const cartItems = useSelector(state => state.cart.cartItems);
    const categoryRef = useRef(null)
   
    const {currentUser, logout} = useAuth()
    const { data: userData } = useGetUserByEmailQuery(currentUser?.email || '', { skip: !currentUser?.email });
    const { data: genres = [] } = useFetchAllGenresQuery();

    const getDisplayName = () => {
        if (userData?.username) {
            return userData.username;
        }
        if (currentUser?.displayName) {
            return currentUser.displayName;
        }
        return currentUser?.email?.split('@')[0] || 'User';
    };

    const avatarUrl = userData?.avatar || currentUser?.photoURL || avatarImg;

    const allCategories = [
        ...genres.map(genre => ({
            name: genre.name,
            icon: getGenreIcon(genre.name),
            href: `/books?genre=${genreToSlug(genre.name)}`
        })),
        ...specialCategories
    ];
    
    const handleLogOut = () => {
        logout()
        setIsDropdownOpen(false)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
  
    return (
        <header className="sticky top-0 z-50 bg-white shadow-md w-full">
            {/* Main Navbar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo and Categories */}
                        <div className="flex items-center space-x-6 -ml-3">
                            <Link to="/" className="flex items-center space-x-2">
                                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                                    <FiBook className="text-white text-2xl" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    BookStore
                                </span>
                            </Link>

                            {/* Categories Dropdown */}
                            <div className="relative hidden lg:block" ref={categoryRef}>
                                <button
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                                >
                                    <IoMenuOutline className="text-xl" />
                                    <span>Categories</span>
                                    <FiChevronDown className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-[800px] bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50">
                                        <div className="grid grid-cols-4 gap-6 px-4">
                                            {/* Featured */}
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 h-[21px]">Featured</h3>
                                                <div className="space-y-1">
                                                    {specialCategories.map((category) => {
                                                        const Icon = category.icon;
                                                        return (
                                                            <Link
                                                                key={category.name}
                                                                to={category.href}
                                                                onClick={() => setIsCategoryOpen(false)}
                                                                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors duration-150"
                                                            >
                                                                <Icon className="text-blue-600 text-sm" />
                                                                <span className="text-sm text-gray-700">{category.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Genres */}
                                            {[0, 1, 2].map((colIndex) => {
                                                const genresPerColumn = Math.ceil(genres.length / 3);
                                                const startIndex = colIndex * genresPerColumn;
                                                const endIndex = startIndex + genresPerColumn;
                                                const columnGenres = genres.slice(startIndex, endIndex);

                                                if (columnGenres.length === 0) return null;

                                                return (
                                                    <div key={colIndex}>
                                                        {colIndex === 0 && (
                                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 h-[21px]">Categories</h3>
                                                        )}
                                                        {colIndex > 0 && (
                                                            <div className="h-[21px] mb-3"></div>
                                                        )}
                                                        <div className="space-y-1">
                                                            {columnGenres.map((genre) => {
                                                                return (
                                                                    <Link
                                                                        key={genre._id}
                                                                        to={`/books?genre=${genreToSlug(genre.name)}`}
                                                                        onClick={() => setIsCategoryOpen(false)}
                                                                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                                                    >
                                                                        {genre.name}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const q = query.trim();
                                if (!q) return;
                                navigate(`/search?q=${encodeURIComponent(q)}`);
                                setTimeout(() => window.scrollTo(0, 0), 100);
                            }}>
                                <div className="relative">
                                    <IoSearchOutline className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                    <input 
                                        type="text" 
                                        placeholder="Search for books, authors, categories..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full pl-12 pr-24 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                                    />
                                    <button 
                                        type="submit"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right Side Icons */}
                        <div className="flex items-center space-x-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 text-gray-600 hover:text-blue-600"
                            >
                                {isMobileMenuOpen ? <IoCloseOutline className="text-2xl" /> : <IoMenuOutline className="text-2xl" />}
                            </button>

                            {/* User Account */}
                            <div className="relative">
                                {currentUser ? (
                                    <>
                                        <button 
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-blue-500 object-cover" />
                                            <span className="hidden md:block text-gray-700 font-medium">{getDisplayName()}</span>
                                            <FiChevronDown className="hidden md:block text-gray-500" />
                                        </button>
                                        
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{currentUser.email}</p>
                                                </div>
                                                {navigation.map((item) => (
                                                    <Link
                                                        key={item.name}
                                                        to={item.href}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                ))}
                                                <button
                                                    onClick={handleLogOut}
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link 
                                        to="/login" 
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <HiOutlineUser className="text-2xl text-gray-600" />
                                        <span className="hidden md:block text-gray-700 font-medium">Login</span>
                                    </Link>
                                )}
                            </div>

                            {/* Cart */}
                            <Link 
                                to="/cart" 
                                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <HiOutlineShoppingCart className="text-2xl text-gray-600" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <div className="md:hidden pb-4">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const q = query.trim();
                            if (!q) return;
                            navigate(`/search?q=${encodeURIComponent(q)}`);
                            setTimeout(() => window.scrollTo(0, 0), 100);
                        }}>
                            <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search books..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full pl-10 pr-20 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden py-4 border-t border-gray-200">
                            <div className="space-y-2">
                                {allCategories.map((category) => {
                                    const Icon = category.icon
                                    return (
                                <Link 
                                            key={category.name}
                                            to={category.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg"
                                        >
                                            <Icon className="text-blue-600" />
                                            <span className="text-gray-700">{category.name}</span>
                                </Link>
                            )
                                })}
                            </div>
                    </div>
                    )}
                </div>
            </nav>
        </header>
    )
}

export default Navbar;