import React from 'react'
import InputField from '../components/InputField'
import { useForm } from 'react-hook-form';
import { useAddGenreMutation } from '../../../redux/features/genres/genresApi';
import Swal from 'sweetalert2';

const AddGenre = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [addGenre, {isLoading, isError}] = useAddGenreMutation()

    const onSubmit = async (data) => {
        const newGenreData = {
            name: data.name,
        }
        
        console.log("Sending genre data:", newGenreData);
        
        try {
            const result = await addGenre(newGenreData).unwrap();
            console.log("Genre added successfully:", result);
            Swal.fire({
                title: "Genre added",
                text: "Your genre is added successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes"
            });
            reset();
        } catch (error) {
            console.error("Add genre error:", error);
            let errorMessage = error?.data?.message || error?.message || "Failed to add genre. Please try again.";
            
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
        }
    }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Add New Genre</h2>
          <p className="text-indigo-100 text-sm mt-1">Fill in the details to add a new genre to the store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <InputField
          label="Genre"
          name="name"
          placeholder="Enter genre name"
          register={register}
          errors={errors}
        />

          <div className="pt-4 border-t border-gray-200">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Genre...
                </span>
              ) : (
                <span>Add New Genre</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddGenre

