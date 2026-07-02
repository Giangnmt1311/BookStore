import React, { useState, useEffect, useRef } from 'react'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import AuthorSearch from '../components/AuthorSearch'
import GenreSearch from '../components/GenreSearch'
import { useForm } from 'react-hook-form';
import { useAddBookMutation } from '../../../redux/features/books/booksApi';
import Swal from 'sweetalert2';
import { uploadToCloudinary } from '../../../utils/uploadToCloud';

const AddBook = () => {
    const { register, handleSubmit, formState: { errors, isSubmitted }, reset, setValue } = useForm();
    const [imageFile, setimageFile] = useState(null);
    const [sampleFile, setSampleFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
    const [addBook, {isLoading, isError}] = useAddBookMutation()
    const [imageFileName, setimageFileName] = useState('')
    const [sampleFileName, setSampleFileName] = useState('')
  const [audioFileName, setAudioFileName] = useState('')
    const [uploading, setUploading] = useState(false);
    const coverImageInputRef = useRef(null);
    const sampleFileInputRef = useRef(null);
    const audioFileInputRef = useRef(null);
    
    const onSubmit = async (data) => {
        console.log("Form data:", data);
        
        if (!imageFile) {
            Swal.fire({
                title: "Error",
                text: "Please select a cover image for the book.",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }

        if (!data.genreId) {
            Swal.fire({
                title: "Error",
                text: "Please select a genre from the dropdown.",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }

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
        let coverImageUrl = '';
        let sampleFileUrl = '';
        let audioFileUrl = '';

        try {
            // Upload cover image
            const imageResult = await uploadToCloudinary(imageFile, 'image', 'books');
            coverImageUrl = imageResult.url;
            console.log("Cover image uploaded:", coverImageUrl);

            if (sampleFile) {
                sampleFileUrl = sampleFileName;
            }

            if (audioFile) {
                try {
                    console.log("Uploading audio file:", audioFile.name, audioFile.type, audioFile.size);
                    const audioResult = await uploadToCloudinary(audioFile, 'audio');
                    audioFileUrl = audioResult.url;
                    console.log("Audio file uploaded successfully:", audioFileUrl);
                } catch (error) {
                    console.error("Error uploading audio file:", error);
                    throw new Error(`Failed to upload audio file: ${error.message}`);
                }
        }

        const newBookData = {
            ...data,
            authorId: data.authorId,
            genreId: data.genreId,
            description: data.description || '',
            pages: data.pages ? Number(data.pages) : 0,
            oldPrice: data.oldPrice ? parseFloat(data.oldPrice) : 0,
            newPrice: data.newPrice ? parseFloat(data.newPrice) : 0,
            stock: data.stock ? Math.floor(Number(data.stock)) : 0,
            soldQuantity: 0,
            isbn: data.isbn || '',
            publicationDate: data.publicationDate || null,
                coverImage: coverImageUrl,
                sampleFile: sampleFileUrl || '',
                audioFile: audioFileUrl || '',
            featured: false
        }
        
        delete newBookData.author;
        delete newBookData.authorBio;
        delete newBookData.genres;
        
        console.log("Sending book data:", newBookData);
        
            const result = await addBook(newBookData).unwrap();
            console.log("Book added successfully:", result);
            Swal.fire({
                title: "Book added",
                text: "Your book is uploaded successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes"
              });
              reset();
              setimageFileName('')
              setimageFile(null);
              setSampleFileName('')
              setSampleFile(null);
              setAudioFileName('')
              setAudioFile(null);
        } catch (error) {
            console.error("Add book error:", error);
            const errorMessage = error?.message || error?.data?.message || "Failed to add book. Please try again.";
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setimageFile(file);
            setimageFileName(file.name);
        }
    }

    const handleSampleFileChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setSampleFile(file);
            setSampleFileName(file.name);
        }
    }

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if(file) {
      setAudioFile(file);
      setAudioFileName(file.name);
    }
  }

  const clearCoverImage = () => {
    setimageFile(null);
    setimageFileName('');
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
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Add New Book</h2>
          <p className="text-indigo-100 text-sm mt-1">Fill in the details to add a new book to the store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <InputField
          label="Title"
          name="title"
          placeholder="Enter book title"
          register={register}
          errors={errors}
        />

        <AuthorSearch
          onSelectAuthor={(author) => {
            console.log('Selected author:', author);
          }}
          register={register}
          setValue={setValue}
          errors={errors}
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
          onSelectGenre={(genre) => {
            console.log('Selected genre:', genre);
          }}
          register={register}
          setValue={setValue}
          errors={errors}
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
          {errors.pages && (
            <p className="mt-1 text-sm text-red-600">{errors.pages.message}</p>
          )}
        </div>

        <InputField
          label="Publisher"
          name="publisher"
          placeholder="Enter publisher name"
          register={register}
          errors={errors}
        />

        <InputField
          label="Language"
          name="language"
          placeholder="Enter book language (e.g., English, Spanish)"
          register={register}
          errors={errors}
        />

        <InputField
          label="ISBN"
          name="isbn"
          placeholder="Enter ISBN"
          register={register}
          errors={errors}
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
          {errors.publicationDate && (
            <p className="mt-1 text-sm text-red-600">{errors.publicationDate.message}</p>
          )}
        </div>

        <InputField
          label="Age Rating"
          name="ageRating"
          placeholder="Enter age rating"
          register={register}
          errors={errors}
        />

        <InputField
          label="Old Price"
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          register={register}
          errors={errors}
        />

        <InputField
          label="New Price"
          name="newPrice"
          type="number"
          placeholder="New Price"
          register={register}
          errors={errors}
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
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
          <div className="relative">
            <input 
              ref={coverImageInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" 
            />
            {imageFileName && (
              <div className="mt-2 text-sm text-green-600 font-medium flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={imageFileName}>
                  <span className="font-semibold">Selected:</span> {imageFileName.length > 60 ? `${imageFileName.substring(0, 60)}...` : imageFileName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sample File (PDF/TXT) - Optional</label>
          <div className="relative">
            <input 
              ref={sampleFileInputRef}
              type="file" 
              accept=".pdf,.txt" 
              onChange={handleSampleFileChange} 
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
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Audio File</label>
          <div className="relative">
            <input 
              ref={audioFileInputRef}
              type="file" 
              accept="audio/*,.mp3,.wav,.ogg,.m4a" 
              onChange={handleAudioFileChange} 
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
          </div>
        </div>

          <div className="pt-4 border-t border-gray-200">
            <button 
              type="submit" 
              disabled={isLoading || uploading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isLoading || uploading) ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploading ? 'Uploading files...' : 'Adding Book...'}
                </span>
              ) : (
                <span>Add New Book</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBook

