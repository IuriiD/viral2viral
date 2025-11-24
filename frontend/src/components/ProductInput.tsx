import React, { useState } from 'react';

interface ProductInputProps {
  onSubmit: (productName: string, productDescription: string) => void;
  isSubmitting: boolean;
}

const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 250;
const MIN_DESCRIPTION_LENGTH = 1;

export const ProductInput: React.FC<ProductInputProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const validateName = (value: string): boolean => {
    if (value.length < MIN_NAME_LENGTH) {
      setNameError(
        `Product name must be at least ${MIN_NAME_LENGTH} characters`
      );
      return false;
    }
    if (value.length > MAX_NAME_LENGTH) {
      setNameError(
        `Product name must not exceed ${MAX_NAME_LENGTH} characters`
      );
      return false;
    }
    setNameError('');
    return true;
  };

  const validateDescription = (value: string): boolean => {
    if (value.length < MIN_DESCRIPTION_LENGTH) {
      setDescriptionError(
        `Product description must be at least ${MIN_DESCRIPTION_LENGTH} character`
      );
      return false;
    }
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(
        `Product description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`
      );
      return false;
    }
    setDescriptionError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductName(value);
    if (value.length > 0) {
      validateName(value);
    } else {
      setNameError('');
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setProductDescription(value);
    if (value.length > 0) {
      validateDescription(value);
    } else {
      setDescriptionError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateName(productName);
    const isDescriptionValid = validateDescription(productDescription);

    if (isNameValid && isDescriptionValid) {
      onSubmit(productName, productDescription);
    }
  };

  const nameCharsRemaining = MAX_NAME_LENGTH - productName.length;
  const descriptionCharsRemaining =
    MAX_DESCRIPTION_LENGTH - productDescription.length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Product Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="productName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={handleNameChange}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              nameError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name (3-100 characters)"
            maxLength={MAX_NAME_LENGTH}
          />
          <div className="flex justify-between items-center mt-1">
            <span
              className={`text-xs ${nameError ? 'text-red-500' : 'text-gray-500'}`}
            >
              {nameError ||
                `${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters required`}
            </span>
            <span
              className={`text-xs ${
                nameCharsRemaining < 20
                  ? 'text-orange-500 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {nameCharsRemaining} characters remaining
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="productDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Description
          </label>
          <textarea
            id="productDescription"
            value={productDescription}
            onChange={handleDescriptionChange}
            disabled={isSubmitting}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 ${
              descriptionError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your product (1-250 characters)"
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <div className="flex justify-between items-center mt-1">
            <span
              className={`text-xs ${
                descriptionError ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {descriptionError || `Max ${MAX_DESCRIPTION_LENGTH} characters`}
            </span>
            <span
              className={`text-xs ${
                descriptionCharsRemaining < 50
                  ? 'text-orange-500 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {descriptionCharsRemaining} characters remaining
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !productName ||
            !productDescription ||
            !!nameError ||
            !!descriptionError
          }
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Product Information'}
        </button>
      </form>
    </div>
  );
};
