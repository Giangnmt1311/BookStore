import React, { useState, useEffect, useRef } from 'react';
import { useFetchAllAuthorsQuery } from '../../../redux/features/authors/authorsApi';

const AuthorSearch = ({ onSelectAuthor, selectedAuthorId, selectedAuthorName, register, setValue, errors }) => {
  const [searchTerm, setSearchTerm] = useState(selectedAuthorName || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { data: authors, isLoading } = useFetchAllAuthorsQuery();

  useEffect(() => {
    if (selectedAuthorName) {
      setSearchTerm(selectedAuthorName);
    }
    if (selectedAuthorId && authors && !selectedAuthorName) {
      const author = authors.find(a => a._id === selectedAuthorId);
      if (author) {
        setSearchTerm(author.name);
      }
    }
  }, [selectedAuthorName, selectedAuthorId, authors]);

  useEffect(() => {
    if (authors && searchTerm) {
      const filtered = authors.filter(author =>
        author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAuthors(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredAuthors([]);
      setShowDropdown(false);
    }
  }, [searchTerm, authors]);

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

  const handleAuthorSelect = (author) => {
    setSearchTerm(author.name);
    setValue('authorId', author._id);
    setValue('author', author.name);
    if (onSelectAuthor) {
      onSelectAuthor(author);
    }
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setValue('author', value);
    setValue('authorId', '');
    if (value.trim() === '') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Author <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredAuthors.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search and select an author..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
        {/* Hidden input to store authorId */}
        <input type="hidden" {...register('authorId', { required: 'Author is required' })} />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {errors?.authorId && (
        <p className="text-red-500 text-sm mt-1">{errors.authorId.message}</p>
      )}

      {showDropdown && filteredAuthors.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredAuthors.map((author) => (
            <div
              key={author._id}
              onClick={() => handleAuthorSelect(author)}
              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{author.name}</div>
              {author.bio && (
                <div className="text-sm text-gray-500 line-clamp-1">{author.bio}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {searchTerm && filteredAuthors.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500 mt-1">
          No authors found. You can still type a new author name.
        </p>
      )}
    </div>
  );
};

export default AuthorSearch;

