import React, { useState, useEffect } from 'react';
import { GenerationPrompt } from '../types';

interface PromptEditorProps {
  prompt: GenerationPrompt | null;
  onUpdate: (editedText: string) => void;
  onApprove: () => void;
  isUpdating: boolean;
  isApproving: boolean;
}

const MAX_PROMPT_LENGTH = 5000;

export const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  onUpdate,
  onApprove,
  isUpdating,
  isApproving,
}) => {
  const [editedText, setEditedText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edited text when prompt loads
  useEffect(() => {
    if (prompt) {
      setEditedText(prompt.finalText);
      setHasChanges(false);
    }
  }, [prompt]);

  if (!prompt) {
    return null;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_PROMPT_LENGTH) {
      setEditedText(value);
      setHasChanges(value !== prompt.finalText);
    }
  };

  const handleUpdate = () => {
    if (editedText.trim() && hasChanges) {
      onUpdate(editedText);
      setHasChanges(false);
    }
  };

  const handleApprove = () => {
    // If there are unsaved changes, update first
    if (hasChanges && editedText.trim()) {
      onUpdate(editedText);
    }
    onApprove();
  };

  const charsRemaining = MAX_PROMPT_LENGTH - editedText.length;
  const isFlagged = prompt.moderationStatus === 'flagged';
  const isApproved = prompt.approvedAt !== undefined;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold">Video Generation Prompt</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and edit the AI-generated prompt for your advertisement video
          </p>
        </div>
        {isApproved && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Approved
          </span>
        )}
      </div>

      {/* Moderation Warning */}
      {isFlagged && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Content Moderation Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This prompt has been flagged for potentially sensitive
                  content:
                </p>
                <ul className="list-disc list-inside mt-1">
                  {prompt.moderationFlags?.map((flag, index) => (
                    <li key={index} className="capitalize">
                      {flag.replace('-', ' ')}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Review and edit the prompt, or click "Approve Anyway" to
                  proceed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Text Editor */}
      <div className="mb-4">
        <label
          htmlFor="promptText"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Prompt Text
        </label>
        <textarea
          id="promptText"
          value={editedText}
          onChange={handleTextChange}
          disabled={isUpdating || isApproving}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 font-mono text-sm"
          placeholder="Enter your video generation prompt..."
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {editedText.trim() ? '✓ Valid prompt' : '⚠ Prompt cannot be empty'}
          </span>
          <span
            className={`text-xs ${
              charsRemaining < 50
                ? 'text-orange-500 font-medium'
                : 'text-gray-500'
            }`}
          >
            {charsRemaining} / {MAX_PROMPT_LENGTH} characters remaining
          </span>
        </div>
      </div>

      {/* Original Generated Prompt (for reference) */}
      {prompt.userEditedText && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
            View original AI-generated prompt
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700 font-mono">
              {prompt.generatedText}
            </p>
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {hasChanges && (
          <button
            onClick={handleUpdate}
            disabled={isUpdating || !editedText.trim() || isApproving}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        )}
        <button
          onClick={handleApprove}
          disabled={
            isApproving ||
            isUpdating ||
            !editedText.trim() ||
            (isApproved && !hasChanges)
          }
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            isFlagged
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isApproving
            ? 'Approving...'
            : isFlagged
              ? 'Approve Anyway'
              : isApproved
                ? 'Approved ✓'
                : 'Approve Prompt'}
        </button>
      </div>

      {/* Info Text */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Once approved, this prompt will be used to generate your advertisement
        video
      </p>
    </div>
  );
};
