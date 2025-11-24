/**
 * Main App Component
 *
 * Root component with workflow components for User Story 1.
 */

import { useWorkflow } from './hooks/useWorkflow';
import { VideoUpload } from './components/VideoUpload';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ProductInput } from './components/ProductInput';

function App() {
  const {
    currentStep,
    isInitializing,
    isUploading,
    isAnalyzing,
    analysis,
    isSubmittingProduct,
    error,
    uploadVideo,
    updateAnalysis,
    submitProductInfo,
    clearError,
  } = useWorkflow();

  const workflowSteps = [
    'Upload Video',
    'AI Analysis',
    'Product Info',
    'Generate Prompt',
    'Generate Video',
  ];

  const getStepIndex = () => {
    switch (currentStep) {
      case 'upload':
        return 0;
      case 'analyzing':
        return 1;
      case 'analysis-complete':
        return 1;
      case 'product-input':
        return 2;
      case 'prompt-generation':
        return 3;
      case 'video-generation':
        return 4;
      case 'complete':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            UGC Video Generator
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Transform your UGC videos into compelling advertisements
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
              <button
                onClick={clearError}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={getStepIndex()}
          steps={workflowSteps}
        />

        {/* Workflow Steps */}
        <div className="space-y-6">
          {/* Step 1: Upload Video */}
          {(currentStep === 'upload' || isUploading) && (
            <VideoUpload
              onUploadStart={uploadVideo}
              onUploadError={(err) => console.error(err)}
              isUploading={isUploading}
              isInitializing={isInitializing}
            />
          )}

          {/* Step 2: Analysis Display */}
          {(currentStep === 'analyzing' ||
            currentStep === 'analysis-complete') && (
            <AnalysisDisplay
              analysisText={analysis?.sceneBreakdown || ''}
              isAnalyzing={isAnalyzing}
              onEdit={updateAnalysis}
              onSave={() => {
                /* Move to next step */
              }}
            />
          )}

          {/* Step 3: Product Input */}
          {currentStep === 'product-input' && (
            <ProductInput
              onSubmit={(name, description) =>
                submitProductInfo(name, description)
              }
              isSubmitting={isSubmittingProduct}
            />
          )}

          {/* Future steps will be added here */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            UGC Video Generator - POC Application
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
