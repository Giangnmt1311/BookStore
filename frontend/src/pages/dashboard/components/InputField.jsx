import React from 'react';

const InputField = ({ label, name, type = 'text', register, placeholder, errors }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea
          {...register(name,  { required: `${label} is required` })}
          className=" p-2 border w-full rounded-md focus:outline-none focus:ring focus:border-blue-300"
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          type={type}
          {...register(name,  { required: `${label} is required` })}
          className=" p-2 border w-full rounded-md focus:outline-none focus:ring focus:border-blue-300"
          placeholder={placeholder}
          step={type === 'number' ? '0.01' : undefined}
        />
      )}
      {errors && errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
};

export default InputField;

