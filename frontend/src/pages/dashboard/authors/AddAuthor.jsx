import React, { useState } from 'react'
import InputField from '../components/InputField'
import { useForm } from 'react-hook-form';
import { useAddAuthorMutation } from '../../../redux/features/authors/authorsApi';
import Swal from 'sweetalert2';
import { uploadToCloudinary } from '../../../utils/uploadToCloud';

const AddAuthor = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [addAuthor, {isLoading, isError}] = useAddAuthorMutation()
    const [photoFile, setPhotoFile] = useState(null);
    const [photoFileName, setPhotoFileName] = useState('');
    const [uploading, setUploading] = useState(false);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setPhotoFile(file);
            setPhotoFileName(file.name);
        }
    }

    const onSubmit = async (data) => {
        if (!photoFile) {
            Swal.fire({
                title: "Error",
                text: "Please select a photo for the author.",
                icon: "error",
                confirmButtonText: "OK"
            });
            return;
        }

        setUploading(true);
        let photoUrl = '';

        try {
            // Upload author photo
            const photoResult = await uploadToCloudinary(photoFile, 'image', 'authors');
            photoUrl = photoResult.url;
            console.log("Author photo uploaded:", photoUrl);

            const newAuthorData = {
                name: data.name,
                bio: data.bio || '',
                photo: photoUrl
            }
            
            console.log("Sending author data:", newAuthorData);
            
            const result = await addAuthor(newAuthorData).unwrap();
            console.log("Author added successfully:", result);
            Swal.fire({
                title: "Author added",
                text: "Your author is added successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes"
            });
            reset();
            setPhotoFileName('');
            setPhotoFile(null);
        } catch (error) {
            console.error("Add author error:", error);
            let errorMessage = error?.message || error?.data?.message || "Failed to add author. Please try again.";
            
            if (error?.status === 401 || error?.status === 403 || errorMessage.includes('token') || errorMessage.includes('credential') || errorMessage.includes('expired')) {
                errorMessage = "Your session has expired. Please login again.";
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/admin';
                }, 2000);
            }
            
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Add New Author</h2>
          <p className="text-indigo-100 text-sm mt-1">Fill in the details to add a new author to the store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <InputField
          label="Name"
          name="name"
          placeholder="Enter author name"
          register={register}
          errors={errors}
        />

        <InputField
          label="Bio"
          name="bio"
          placeholder="Enter author biography"
          type="textarea"
          register={register}
          errors={errors}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Author Photo</label>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" 
            />
            {photoFileName && (
              <div className="mt-2 text-sm text-green-600 font-medium flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <svg className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 break-words" title={photoFileName}>
                  <span className="font-semibold">Selected:</span> {photoFileName.length > 60 ? `${photoFileName.substring(0, 60)}...` : photoFileName}
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
                  {uploading ? 'Uploading photo...' : 'Adding Author...'}
                </span>
              ) : (
                <span>Add New Author</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAuthor

