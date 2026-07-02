import React, { useState, useEffect, useRef } from 'react';
import { useFetchAllGenresQuery } from '../../../redux/features/genres/genresApi';

const GenreSearch = ({ onSelectGenre, selectedGenreId, selectedGenreName, register, setValue, errors }) => {
  const [searchTerm, setSearchTerm] = useState(selectedGenreName || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredGenres, setFilteredGenres] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { data: genres, isLoading } = useFetchAllGenresQuery();

  useEffect(() => {
    if (selectedGenreName) {
      setSearchTerm(selectedGenreName);
    }
    if (selectedGenreId && genres && !selectedGenreName) {
      const genre = genres.find(g => g._id === selectedGenreId);
      if (genre) {
        setSearchTerm(genre.name);
      }
    }
  }, [selectedGenreName, selectedGenreId, genres]);

  useEffect(() => {
    if (genres && searchTerm) {
      const filtered = genres.filter(genre =>
        genre.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGenres(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredGenres([]);
      setShowDropdown(false);
    }
  }, [searchTerm, genres]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGenreSelect = (genre) => {
    setSearchTerm(genre.name);
    setValue('genreId', genre._id);
    setValue('genres', genre.name);
    if (onSelectGenre) {
      onSelectGenre(genre);
    }
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setValue('genres', value);
    setValue('genreId', '');
    if (value.trim() === '') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Genre <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredGenres.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search and select a genre..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
        {/* Hidden input to store genreId */}
        <input type="hidden" {...register('genreId', { required: 'Genre is required' })} />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {errors?.genreId && (
        <p className="text-red-500 text-sm mt-1">{errors.genreId.message}</p>
      )}

      {showDropdown && filteredGenres.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredGenres.map((genre) => (
            <div
              key={genre._id}
              onClick={() => handleGenreSelect(genre)}
              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{genre.name}</div>
            </div>
          ))}
        </div>
      )}

      {searchTerm && filteredGenres.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500 mt-1">
          No genres found. Please select a genre from the dropdown.
        </p>
      )}
    </div>
  );
};

export default GenreSearch;

