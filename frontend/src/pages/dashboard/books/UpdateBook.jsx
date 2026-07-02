import React, { useEffect, useState, useRef } from 'react'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import AuthorSearch from '../components/AuthorSearch'
import GenreSearch from '../components/GenreSearch'
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useFetchBookByIdQuery, useUpdateBookMutation } from '../../../redux/features/books/booksApi';
import { useFetchAllAuthorsQuery } from '../../../redux/features/authors/authorsApi';
import { useFetchAllGenresQuery } from '../../../redux/features/genres/genresApi';
import Loading from '../../../components/Loading';
import Swal from 'sweetalert2';
import axios from 'axios';
import getBaseUrl from '../../../utils/baseURL';
import { uploadToCloudinary } from '../../../utils/uploadToCloud';
import { deleteFromCloudinary } from '../../../utils/deleteFromCloud';

const UpdateBook = () => {
  const { id } = useParams();
  const { data: bookData, isLoading, isError, refetch } = useFetchBookByIdQuery(id);
  const { data: authors } = useFetchAllAuthorsQuery();
  const { data: genres } = useFetchAllGenresQuery();
  const [updateBook] = useUpdateBookMutation();
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitted } } = useForm();
  const [sampleFile, setSampleFile] = useState(null);
  const [sampleFileName, setSampleFileName] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImageFileName, setCoverImageFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const coverImageInputRef = useRef(null);
  const sampleFileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  useEffect(() => {
    if (bookData) {
      setValue('title', bookData.title);
      if (bookData.authorId) {
        const authorId = typeof bookData.authorId === 'object' ? bookData.authorId._id : bookData.authorId;
        setValue('authorId', authorId);
        const authorName = typeof bookData.authorId === 'object' ? bookData.authorId.name : (bookData.author || '');
        setValue('author', authorName);
      } else if (bookData.author) {
        if (authors) {
          const matchingAuthor = authors.find(a => a.name === bookData.author);
          if (matchingAuthor) {
            setValue('authorId', matchingAuthor._id);
            setValue('author', matchingAuthor.name);
          } else {
            setValue('author', bookData.author);
          }
        } else {
      setValue('author', bookData.author);
        }
      }
      setValue('description', bookData.description || '');
      if (bookData.genreId) {
        const genreId = typeof bookData.genreId === 'object' ? bookData.genreId._id : bookData.genreId;
        setValue('genreId', genreId);
        const genreName = typeof bookData.genreId === 'object' ? bookData.genreId.name : (bookData.genres || '');
        setValue('genres', genreName);
      } else if (bookData.genres) {
        if (genres) {
          const matchingGenre = genres.find(g => g.name === bookData.genres);
          if (matchingGenre) {
            setValue('genreId', matchingGenre._id);
            setValue('genres', matchingGenre.name);
          } else {
            setValue('genres', bookData.genres);
          }
        } else {
          setValue('genres', bookData.genres);
        }
      }
      setValue('pages', bookData.pages || '');
      setValue('publisher', bookData.publisher || '');
      setValue('language', bookData.language || '');
      setValue('ageRating', bookData.ageRating || '');
      setValue('isbn', bookData.isbn || '');
      if (bookData.publicationDate) {
        const date = new Date(bookData.publicationDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        setValue('publicationDate', `${day}/${month}/${year}`);
      } else {
        setValue('publicationDate', '');
      }
      setValue('oldPrice', bookData.oldPrice);
      setValue('newPrice', bookData.newPrice);
      setValue('stock', bookData.stock || 0);
      setCoverImageFileName('');
      setSampleFileName('');
      setAudioFileName('');
      setCoverImageFile(null);
      setSampleFile(null);
      setAudioFile(null);
    }
  }, [bookData, authors, genres, setValue])

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImageFileName(file.name);
    } else {
      setCoverImageFile(null);
      setCoverImageFileName('');
    }
  };

  const handleSampleFileChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      setSampleFile(file);
      setSampleFileName(file.name);
    } else {
      setSampleFile(null);
      setSampleFileName('');
    }
  }

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      setAudioFile(file);
      setAudioFileName(file.name);
    } else {
      setAudioFile(null);
      setAudioFileName('');
    }
  }

  const clearCoverImage = () => {
    setCoverImageFile(null);
    setCoverImageFileName('');
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  }

  const clearSampleFile = () => {
    setSampleFile(null);
    setSampleFileName('');
    if (sampleFileInputRef.current) {
      sampleFileInputRef.current.value = '';
    }
  }

  const clearAudioFile = () => {
    setAudioFile(null);
    setAudioFileName('');
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  }

  const onSubmit = async (data) => {
    if (!data.authorId) {
      Swal.fire({
        title: "Error",
        text: "Please select an author from the dropdown.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    setUploading(true);
    let coverImageUrl = bookData.coverImage;
    let sampleFileUrl = bookData.sampleFile;
    let audioFileUrl = bookData.audioFile;

    try {
      if (coverImageFile && bookData.coverImage && bookData.coverImage.startsWith('http')) {
        try {
          await deleteFromCloudinary(bookData.coverImage, 'image');
          console.log("Old cover image deleted");
        } catch (error) {
          console.warn("Could not delete old cover image:", error);
        }
      }

      if (audioFile && bookData.audioFile && bookData.audioFile.startsWith('http')) {
        try {
          await deleteFromCloudinary(bookData.audioFile, 'video');
          console.log("Old audio file deleted");
        } catch (error) {
          console.warn("Could not delete old audio file:", error);
        }
      }

      if (coverImageFile) {
        const imageResult = await uploadToCloudinary(coverImageFile, 'image', 'books');
        coverImageUrl = imageResult.url;
        console.log("Cover image uploaded:", coverImageUrl);
      }

      if (sampleFile) {
        sampleFileUrl = sampleFileName;
      }

      if (audioFile) {
        const audioResult = await uploadToCloudinary(audioFile, 'audio');
        audioFileUrl = audioResult.url;
        console.log("Audio file uploaded:", audioFileUrl);
    }

    const updateBookData = {
      title: data.title,
      authorId: data.authorId,
      genreId: data.genreId,
      description: data.description || '',
      pages: data.pages ? Number(data.pages) : 0,
      publisher: data.publisher || '',
      language: data.language || '',
      ageRating: data.ageRating || '',
      isbn: data.isbn || '',
      publicationDate: data.publicationDate || null,
      oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : 0,
      newPrice: data.newPrice ? parseFloat(data.newPrice) : 0,
      stock: data.stock !== undefined ? Math.floor(Number(data.stock)) : (bookData.stock || 0),
        coverImage: coverImageUrl,
        sampleFile: sampleFileUrl || '',
        audioFile: audioFileUrl || '',
    };
      
      await axios.put(`${getBaseUrl()}/api/books/edit/${id}`, updateBookData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      Swal.fire({
        title: "Book Updated",
        text: "Your book is updated successfully!",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes"
      });
      await refetch()
    } catch (error) {
      console.error("Failed to update book:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update book. Please try again.";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setUploading(false);
    }
  }
  if (isLoading) return <Loading />
  if (isError) return <div className="text-center py-12"><p className="text-red-600 font-medium">Error fetching book data</p></div>
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Update Book</h2>
          <p className="text-indigo-100 text-sm mt-1">Edit the book details below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <InputField
          label="Title"
          name="title"
          placeholder="Enter book title"
          register={register}
        />

        <AuthorSearch
          selectedAuthorId={bookData?.authorId ? (typeof bookData.authorId === 'object' ? bookData.authorId._id : bookData.authorId) : null}
          selectedAuthorName={bookData?.author || (bookData?.authorId && typeof bookData.authorId === 'object' ? bookData.authorId.name : '')}
          onSelectAuthor={(author) => {
            console.log('Selected author:', author);
          }}
          register={register}
          setValue={setValue}
          errors={{}}
        />

        <InputField
          label="Description"
          name="description"
          placeholder="Enter book description"
          type="textarea"
          register={register}
          errors={errors}
        />


        <GenreSearch
          selectedGenreId={bookData?.genreId ? (typeof bookData.genreId === 'object' ? bookData.genreId._id : bookData.genreId) : null}
          selectedGenreName={bookData?.genres || (bookData?.genreId && typeof bookData.genreId === 'object' ? bookData.genreId.name : '')}
          onSelectGenre={(genre) => {
            console.log('Selected genre:', genre);
          }}
          register={register}
          setValue={setValue}
          errors={{}}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pages</label>
          <input
            type="number"
            step="1"
            min="1"
            placeholder="Enter total pages"
            {...register("pages", {
              valueAsNumber: true,
              min: { value: 1, message: "Pages must be at least 1" },
              validate: (value) =>
                value === undefined ||
                Number.isInteger(value) ||
                "Pages must be a whole number"
            })}
            onInput={(e) => {
              const value = e.target.value;
              if (value.includes('.')) {
                e.target.value = Math.floor(Number(value)) || 1;
              }
            }}
            onChange={(e) => {
              const value = e.target.value;
              if (value && !Number.isInteger(Number(value))) {
                e.target.value = Math.floor(Number(value)) || 1;
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          />
          {errors?.pages && (
            <p className="mt-1 text-sm text-red-600">{errors.pages.message}</p>
          )}
        </div>

        <InputField
          label="Publisher"
          name="publisher"
          placeholder="Enter publisher name"
          register={register}
        />

        <InputField
          label="Language"
          name="language"
          placeholder="Enter book language (e.g., English, Spanish)"
          register={register}
        />

        <InputField
          label="ISBN"
          name="isbn"
          placeholder="Enter ISBN"
          register={register}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Publication Date</label>
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            {...register("publicationDate", {
              pattern: {
                value: /^(\d{2})\/(\d{2})\/(\d{4})$/,
                message: "Please enter date in DD/MM/YYYY format"
              }
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
        </div>

        <InputField
          label="Age Rating"
          name="ageRating"
          placeholder="Enter age rating"
          register={register}
        />

        <InputField
          label="Old Price"
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          register={register}
        />

        <InputField
          label="New Price"
          name="newPrice"
          type="number"
          placeholder="New Price"
          register={register}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Enter stock quantity"
            {...register("stock", {
              valueAsNumber: true,
              min: { value: 0, message: "Stock must be 0 or greater" }
            })}
            onInput={(e) => {
              const value = e.target.value;
              if (value.includes('.')) {
                e.target.value = Math.floor(Number(value)) || 0;
              }
            }}
            onChange={(e) => {
              const value = e.target.value;
              if (value && !Number.isInteger(Number(value))) {
                e.target.value = Math.floor(Number(value)) || 0;
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
          <div className="relative">
            <input 
              ref={coverImageInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleCoverImageChange} 
              onClick={(event)=> event.target.value = null}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" 
            />
            {coverImageFileName ? (
              <div className="mt-2 text-sm text-green-600 font-medium flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={coverImageFileName}>
                  <span className="font-semibold">Selected:</span> {coverImageFileName.length > 60 ? `${coverImageFileName.substring(0, 60)}...` : coverImageFileName}
                </span>
              </div>
            ) : (
              bookData?.coverImage && (
                <div className="mt-2 text-sm text-gray-600 font-medium flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 break-words" title={bookData.coverImage}>
                    <span className="font-semibold">Current:</span> {bookData.coverImage.length > 60 ? `${bookData.coverImage.substring(0, 60)}...` : bookData.coverImage}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sample File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sample File (PDF/TXT)</label>
          <div className="relative">
            <input 
              ref={sampleFileInputRef}
              type="file" 
              accept=".pdf,.txt" 
              onChange={handleSampleFileChange} 
              onClick={(event)=> event.target.value = null}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" 
            />
            {sampleFileName && (
              <div className="mt-2 text-sm text-green-600 font-medium flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={sampleFileName}>
                  <span className="font-semibold">Selected:</span> {sampleFileName.length > 60 ? `${sampleFileName.substring(0, 60)}...` : sampleFileName}
                </span>
              </div>
            )}
            {bookData?.sampleFile && !sampleFileName && (
              <div className="mt-2 text-sm text-gray-600 font-medium flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={bookData.sampleFile}>
                  <span className="font-semibold">Current:</span> {bookData.sampleFile.length > 60 ? `${bookData.sampleFile.substring(0, 60)}...` : bookData.sampleFile}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Audiobook Upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Audio File</label>
          <div className="relative">
            <input 
              ref={audioFileInputRef}
              type="file" 
              accept="audio/*,.mp3,.wav,.ogg,.m4a" 
              onChange={handleAudioFileChange} 
              onClick={(event)=> event.target.value = null}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" 
            />
            {audioFileName && (
              <div className="mt-2 text-sm text-green-600 font-medium flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={audioFileName}>
                  <span className="font-semibold">Selected:</span> {audioFileName.length > 60 ? `${audioFileName.substring(0, 60)}...` : audioFileName}
                </span>
              </div>
            )}
            {bookData?.audioFile && !audioFileName && (
              <div className="mt-2 text-sm text-gray-600 font-medium flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={bookData.audioFile}>
                  <span className="font-semibold">Current:</span> {bookData.audioFile.length > 60 ? `${bookData.audioFile.substring(0, 60)}...` : bookData.audioFile}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={uploading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading files...
              </span>
            ) : (
              <span>Update Book</span>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
  )
}

export default UpdateBook

