import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetchAllBannersQuery, useUpdateBannerMutation } from '../../../redux/features/banners/bannersApi';
import Swal from 'sweetalert2';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { uploadToCloudinary } from '../../../utils/uploadToCloud';
import { deleteFromCloudinary } from '../../../utils/deleteFromCloud';

const UpdateBanner = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: banners } = useFetchAllBannersQuery();
    const [updateBanner, { isLoading }] = useUpdateBannerMutation();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const [imageFile, setImageFile] = useState(null);
    const [imageFileName, setImageFileName] = useState('');
    const [uploading, setUploading] = useState(false);

    const banner = banners?.find(b => b._id === id);

    useEffect(() => {
        if (banner) {
            setValue('title', banner.title);
            setValue('isActive', banner.isActive.toString());
            setValue('displayOrder', banner.displayOrder || 1);
            setImageFileName(banner.imageUrl || '');
        }
    }, [banner, setValue]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImageFile(file);
            setImageFileName(file.name);
        }
    };

    const onSubmit = async (data) => {
        setUploading(true);
        let imageUrl = banner?.imageUrl || '';

        try {
            if (imageFile && banner?.imageUrl && banner.imageUrl.startsWith('http')) {
                try {
                    await deleteFromCloudinary(banner.imageUrl, 'image');
                    console.log("Old banner image deleted");
                } catch (error) {
                    console.warn("Could not delete old banner image:", error);
                }
            }

            if (imageFile) {
                const imageResult = await uploadToCloudinary(imageFile, 'image', 'banners');
                imageUrl = imageResult.url;
                console.log("Banner image uploaded:", imageUrl);
            }

            const updatedBanner = {
                id,
                ...data,
                imageUrl: imageUrl,
                isActive: data.isActive === 'true',
                displayOrder: data.displayOrder ? Number(data.displayOrder) : 1
            };
            await updateBanner(updatedBanner).unwrap();
            Swal.fire({
                title: "Banner Updated",
                text: "Your banner is updated successfully!",
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes"
            });
            navigate('/dashboard/manage-banners');
        } catch (error) {
            const errorMessage = error?.message || error?.data?.message || "Failed to update banner. Please try again.";
            Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "OK"
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">Update Banner</h2>
                    <p className="text-indigo-100 text-sm mt-1">Edit the banner details below</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <InputField
                        label="Title"
                        name="title"
                        placeholder="Enter banner title"
                        register={register}
                        errors={errors}
                    />

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image</label>
                        <div className="relative">
                            <input 
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
                                        <span className="font-semibold">{imageFile ? 'Selected:' : 'Current:'}</span> {imageFileName.length > 60 ? `${imageFileName.substring(0, 60)}...` : imageFileName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            {...register('displayOrder', { 
                                required: 'Display order is required',
                                min: { value: 1, message: 'Display order must be between 1 and 5' },
                                max: { value: 5, message: 'Display order must be between 1 and 5' }
                            })}
                            placeholder="Enter display order (1-5)"
                            className="p-2 border w-full rounded-md focus:outline-none focus:ring focus:border-blue-300"
                        />
                        {errors.displayOrder && (
                            <p className="text-red-500 text-sm mt-1">{errors.displayOrder.message}</p>
                        )}
                    </div>

                    <SelectField
                        label="Status"
                        name="isActive"
                        options={[
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' },
                        ]}
                        register={register}
                    />

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
                                    {uploading ? 'Uploading image...' : 'Updating Banner...'}
                                </span>
                            ) : (
                                <span>Update Banner</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateBanner;

