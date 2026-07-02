import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi'
import { useFetchAllGenresQuery } from '../../redux/features/genres/genresApi'
import BookCard from '../books/BookCard'
import { IoSearchOutline, IoFilterOutline, IoGridOutline, IoListOutline } from 'react-icons/io5'
import { HiOutlineChevronDown } from 'react-icons/hi2'

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: books = [], isLoading, isError } = useFetchAllBooksQuery();
  const { data: genresData = [] } = useFetchAllGenresQuery();
  
  // Search query
  const q = useMemo(()=> new URLSearchParams(location.search).get('q')?.toLowerCase() || '', [location.search]);
  const hasQuery = q.trim().length > 0;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [q]);
  
  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('Relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const genres = useMemo(() => {
    return ['All', ...genresData.map(g => g.name)];
  }, [genresData]);
  
  const priceRanges = [
    { label: 'All', value: 'All' },
    { label: 'Under $10', value: 'under-10' },
    { label: '$10 - $25', value: '10-25' },
    { label: '$25 - $50', value: '25-50' },
    { label: 'Over $50', value: 'over-50' }
  ];

  const sortOptions = [
    { label: 'Relevance', value: 'Relevance' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Title: A to Z', value: 'title-asc' },
    { label: 'Title: Z to A', value: 'title-desc' },
    { label: 'Newest First', value: 'newest' }
  ];

  // Filter and sort results
  const results = useMemo(() => {
    let filtered = books;
    
    // Search filter
    if (hasQuery) {
      filtered = filtered.filter(b => 
        b.title?.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q) || 
        b.author?.toLowerCase().includes(q)
      );
    }
    
    // Genre filter
    if (selectedGenre !== 'All') {
      const matchingGenre = genresData.find(g => g.name === selectedGenre);
      if (matchingGenre) {
        filtered = filtered.filter(book => {
          if (book.genreId) {
            const genreId = typeof book.genreId === 'object' ? book.genreId._id : book.genreId;
            return genreId === matchingGenre._id;
          }
          return book.genres && book.genres.toLowerCase() === selectedGenre.toLowerCase();
        });
      }
    }
    
    // Price range filter
    if (priceRange !== 'All') {
      filtered = filtered.filter(book => {
        const price = book.newPrice || book.price || 0;
        switch (priceRange) {
          case 'under-10': return price < 10;
          case '10-25': return price >= 10 && price <= 25;
          case '25-50': return price >= 25 && price <= 50;
          case 'over-50': return price > 50;
          default: return true;
        }
      });
    }
    
    // Sort results
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => (a.newPrice || a.price || 0) - (b.newPrice || b.price || 0));
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => (b.newPrice || b.price || 0) - (a.newPrice || a.price || 0));
        break;
      case 'title-asc':
        filtered = [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title-desc':
        filtered = [...filtered].sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }
    
    return filtered;
  }, [books, q, hasQuery, selectedGenre, priceRange, sortBy]);

  const clearFilters = () => {
    setSelectedGenre('All');
    setPriceRange('All');
    setSortBy('Relevance');
  };

  if(isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading search results...</p>
      </div>
    </div>
  )
  
  if(isError) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-lg">Failed to load search results</p>
        <p className="text-gray-600 mt-2">Please try again later</p>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {hasQuery ? `Search Results for "${q}"` : 'Search Results'}
            </h1>
            <p className="text-gray-600">
              {hasQuery ? `${results.length} book${results.length !== 1 ? 's' : ''} found` : 'Enter a search term to find books'}
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <IoGridOutline className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <IoListOutline className="text-lg" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <IoFilterOutline className="text-lg" />
              <span>Filters</span>
              <HiOutlineChevronDown className={`text-sm transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {!hasQuery ? (
          <div className="text-center py-16">
            <IoSearchOutline className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Start your search</h3>
            <p className="text-gray-500 mb-6">Enter a book title, author name, or topic to find what you're looking for</p>
            
            {/* Popular Categories */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm text-gray-600 mb-3">Popular genres:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {genres.slice(1, 6).map(genre => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      navigate(`/search?q=${encodeURIComponent(genre)}`);
                      setTimeout(() => {
                        window.scrollTo(0, 0);
                      }, 100);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <IoSearchOutline className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search terms or filters</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {results.map((book) => (
              <BookCard key={book._id} book={book} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults


