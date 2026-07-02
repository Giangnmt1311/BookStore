import React, { useEffect } from 'react'
import InputField from '../components/InputField'
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useFetchGenreByIdQuery, useUpdateGenreMutation } from '../../../redux/features/genres/genresApi';
import Loading from '../../../components/Loading';
import Swal from 'sweetalert2';

const UpdateGenre = () => {
  const { id } = useParams();
  const { data: genreData, isLoading, isError, refetch } = useFetchGenreByIdQuery(id);
  const [updateGenre] = useUpdateGenreMutation();
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    if (genreData) {
      setValue('name', genreData.name);
    }
  }, [genreData, setValue])

  const onSubmit = async (data) => {
    const updateGenreData = {
      name: data.name,
    };
    try {
      await updateGenre({ id, ...updateGenreData }).unwrap();
      Swal.fire({
        title: "Genre Updated",
        text: "Your genre is updated successfully!",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes"
      });
      await refetch()
    } catch (error) {
      console.log("Failed to update genre.");
      Swal.fire({
        title: "Error",
        text: "Failed to update genre. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  }
  if (isLoading) return <Loading />
  if (isError) return <div className="text-center py-12"><p className="text-red-600 font-medium">Error fetching genre data</p></div>
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Update Genre</h2>
          <p className="text-indigo-100 text-sm mt-1">Edit the genre details below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <InputField
          label="Genre"
          name="name"
          placeholder="Enter genre name"
          register={register}
        />

        <div className="pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Update Genre
          </button>
        </div>
      </form>
    </div>
  </div>
  )
}

export default UpdateGenre

