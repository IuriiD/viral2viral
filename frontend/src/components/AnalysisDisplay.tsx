import { useState, useEffect } from 'react';

interface AnalysisDisplayProps {
  analysisText: string;
  isAnalyzing: boolean;
  onEdit: (editedText: string) => void;
  onSave: () => void;
}

/**
 * AnalysisDisplay Component
 *
 * Displays video analysis results with editing capability
 */
export function AnalysisDisplay({
  analysisText,
  isAnalyzing,
  onEdit,
  onSave,
}: AnalysisDisplayProps) {
  const [editedText, setEditedText] = useState(analysisText);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedText(analysisText);
  }, [analysisText]);

  const handleSave = () => {
    onEdit(editedText);
    onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(analysisText);
    setIsEditing(false);
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Video Analysis</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Analyzing video with AI...</p>
            <p className="text-sm text-gray-500 mt-2">
              This may take 30-60 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Video Analysis</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm bg-gray-900 text-gray-100"
            placeholder="Scene breakdown..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <pre className="whitespace-pre-wrap bg-gray-900 text-gray-100 p-6 rounded-lg text-sm font-mono overflow-x-auto text-left shadow-inner max-h-[600px] overflow-y-auto">
            {typeof analysisText === 'string'
              ? analysisText
              : JSON.stringify(analysisText, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
