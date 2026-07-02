import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFetchAllBooksQuery, useFetchBestSellersQuery } from '../../redux/features/books/booksApi'
import { useFetchAllGenresQuery } from '../../redux/features/genres/genresApi'
import BookCard from './BookCard'

const filterByGenreMatch = (bookList, matchingGenre) => {
  if (!matchingGenre) return bookList;
  
  return bookList.filter(book => {
    if (book.genreId) {
      const genreId = typeof book.genreId === 'object' ? book.genreId._id : book.genreId;
      return genreId === matchingGenre._id;
    }

    return book.genres && book.genres.toLowerCase() === matchingGenre.name.toLowerCase();
  });
};

const CategoriesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: books = [], isLoading, isError } = useFetchAllBooksQuery();
  const { data: bestSellersData = [] } = useFetchBestSellersQuery();
  const { data: genresData = [] } = useFetchAllGenresQuery();
  const [selectedGenre, setSelectedGenre] = useState("All");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const genre = searchParams.get('genre')?.toLowerCase() || '';
  const q = searchParams.get('q')?.toLowerCase() || '';

  const genres = useMemo(() => {
    const genreNames = genresData.map(g => g.name);
    const specialGenres = ['Best Sellers', 'New Releases', 'All Deals'];
    return ['All', ...genreNames, ...specialGenres];
  }, [genresData]);

  const genreToSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
  };

  const slugToGenreName = (slug) => {
    return slug.replace(/-/g, ' ');
  };

  const filteredBooks = useMemo(() => {
    let filtered = books;
    
    const normalizedGenre = genre ? genre.replace(/-/g, ' ') : '';
    
    if (genre && genre !== 'all') {
      if (normalizedGenre === 'best sellers') {
        filtered = bestSellersData;
      } else if (normalizedGenre === 'new releases') {
        filtered = [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (normalizedGenre === 'all deals') {
        filtered = books
          .filter(book => book.oldPrice > book.newPrice)
          .sort((a, b) => {
            const discountA = ((a.oldPrice - a.newPrice) / a.oldPrice) * 100;
            const discountB = ((b.oldPrice - b.newPrice) / b.oldPrice) * 100;
            return discountB - discountA;
          });
      } else {
        const genreName = slugToGenreName(normalizedGenre);
        const matchingGenre = genresData.find(g => 
          g.name.toLowerCase() === genreName || 
          genreToSlug(g.name) === normalizedGenre
        );
        
        filtered = filterByGenreMatch(filtered, matchingGenre);
      }
    } else if (selectedGenre !== 'All') {
      const normalizedSelected = selectedGenre.toLowerCase();
      if (normalizedSelected === 'best sellers') {
        filtered = bestSellersData;
      } else if (normalizedSelected === 'new releases') {
        filtered = [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (normalizedSelected === 'all deals') {
        filtered = books
          .filter(book => book.oldPrice > book.newPrice)
          .sort((a, b) => {
            const discountA = ((a.oldPrice - a.newPrice) / a.oldPrice) * 100;
            const discountB = ((b.oldPrice - b.newPrice) / b.oldPrice) * 100;
            return discountB - discountA;
          });
      } else {
        const matchingGenre = genresData.find(g => {
          const normalizedName = g.name.toLowerCase();
          return normalizedName === normalizedSelected || genreToSlug(g.name) === genreToSlug(selectedGenre);
        });

        filtered = filterByGenreMatch(filtered, matchingGenre);
      }
    }
    
    if (q) {
      filtered = filtered.filter(book => 
        book.title?.toLowerCase().includes(q) || 
        book.description?.toLowerCase().includes(q) || 
        book.author?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [books, bestSellersData, genre, selectedGenre, q]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading books...</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-xl">Failed to load books</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Books</h1>
          <p className="text-xl text-gray-600">
            {genre ? (() => {
              const normalizedGenre = genre.replace(/-/g, ' ');
              if (normalizedGenre === 'best sellers') return 'Our most popular and best-selling books';
              if (normalizedGenre === 'new releases') return 'Latest book releases and new arrivals';
              if (normalizedGenre === 'all deals') return 'Special offers and discounted books';
              if (normalizedGenre === 'office supplies') return 'Our office supplies';
              return `Books in ${normalizedGenre.charAt(0).toUpperCase() + normalizedGenre.slice(1)} genre`;
            })() : 
             q ? `Search results for "${q}"` : 
             'Discover our complete collection of books'}
          </p>
        </div>

        {/* Genre Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {genres.map((gen) => {
              const isSpecialGenre = ['Best Sellers', 'New Releases', 'All Deals'].includes(gen);
              const genreSlug = gen.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
              const isActive = (genre && genre === genreSlug) || 
                              (!genre && selectedGenre === gen);
              
              const handleGenreClick = () => {
                if (gen === 'All') {
                  navigate('/books');
                  setSelectedGenre('All');
                } else {
                  const slug = genreToSlug(gen);
                  navigate(`/books?genre=${slug}`);
                  setSelectedGenre(gen);
                }
              };
              
              return (
                <button
                  key={gen}
                  onClick={handleGenreClick}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {gen}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">
              {q ? `No books match your search "${q}"` : 
                 genre ? `No books found in ${genre} genre` : 
                 'No books available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
