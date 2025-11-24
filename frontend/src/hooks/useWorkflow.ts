import { useState, useCallback, useEffect } from 'react';
import {
  createSession,
  uploadVideo,
  triggerAnalysis,
  getAnalysisStatus,
  updateAnalysis,
  submitProductInfo,
  VideoAnalysis,
} from '../services/api';

type WorkflowStep =
  | 'upload'
  | 'analyzing'
  | 'analysis-complete'
  | 'product-input'
  | 'prompt-generation'
  | 'video-generation'
  | 'complete';

interface UseWorkflowState {
  currentStep: WorkflowStep;
  sessionId: string | null;
  isInitializing: boolean;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  analysis: VideoAnalysis | null;
  productName: string | null;
  productDescription: string | null;
  isSubmittingProduct: boolean;
  error: string | null;
}

/**
 * Custom hook for managing the video generation workflow
 */
export function useWorkflow() {
  const [state, setState] = useState<UseWorkflowState>({
    currentStep: 'upload',
    sessionId: null,
    isInitializing: true,
    isUploading: false,
    uploadProgress: 0,
    isAnalyzing: false,
    analysis: null,
    productName: null,
    productDescription: null,
    isSubmittingProduct: false,
    error: null,
  });

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    let isSubscribed = true; // Flag to prevent state updates after unmount

    const initSession = async () => {
      try {
        // Try to get existing session ID from localStorage
        const storedSessionId = localStorage.getItem('sessionId');
        
        if (storedSessionId) {
          console.log('Found stored session ID:', storedSessionId);
          // Verify session still exists by trying to get analysis status
          try {
            await getAnalysisStatus(storedSessionId);
            console.log('Session is valid, reusing:', storedSessionId);
            if (isSubscribed) {
              setState((prev) => ({
                ...prev,
                sessionId: storedSessionId,
                isInitializing: false,
              }));
              return;
            }
          } catch (error) {
            console.log('Stored session is invalid, creating new one');
            localStorage.removeItem('sessionId');
          }
        }

        console.log('Creating new session...');
        const session = await createSession();
        
        // Store session ID in localStorage
        localStorage.setItem('sessionId', session.sessionId);
        
        // Only update state if component is still mounted
        if (isSubscribed) {
          console.log('Session created:', session.sessionId);
          setState((prev) => ({
            ...prev,
            sessionId: session.sessionId,
            isInitializing: false,
          }));
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        if (isSubscribed) {
          setState((prev) => ({
            ...prev,
            isInitializing: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create session',
          }));
        }
      }
    };

    initSession();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isSubscribed = false;
    };
  }, []);

  /**
   * Trigger video analysis
   */
  const handleTriggerAnalysis = useCallback(async () => {
    if (!state.sessionId) return;

    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      currentStep: 'analyzing',
      error: null,
    }));

    try {
      console.log('Triggering analysis for session:', state.sessionId);
      const result = await triggerAnalysis(state.sessionId);
      console.log('Analysis triggered:', result);

      // Start polling for analysis results
      const pollInterval = setInterval(async () => {
        try {
          const analysis = await getAnalysisStatus(state.sessionId!);
          console.log('Analysis status:', analysis.status);

          if (analysis.status === 'complete') {
            clearInterval(pollInterval);
            setState((prev) => ({
              ...prev,
              isAnalyzing: false,
              analysis,
              currentStep: 'analysis-complete',
            }));
          } else if (analysis.status === 'failed') {
            clearInterval(pollInterval);
            setState((prev) => ({
              ...prev,
              isAnalyzing: false,
              error: analysis.error?.message || 'Analysis failed',
            }));
          }
        } catch (error) {
          console.error('Error checking analysis status:', error);
          clearInterval(pollInterval);
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to check analysis status',
          }));
        }
      }, 3000); // Poll every 3 seconds
    } catch (error) {
      console.error('Error triggering analysis:', error);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error:
          error instanceof Error ? error.message : 'Failed to trigger analysis',
      }));
    }
  }, [state.sessionId]);

  /**
   * Upload video file
   */
  const handleUploadVideo = useCallback(
    async (file: File) => {
      if (!state.sessionId) {
        console.error('Upload attempted without session ID');
        setState((prev) => ({
          ...prev,
          error: 'Session not ready. Please refresh the page and try again.',
        }));
        return;
      }

      console.log('Uploading video for session:', state.sessionId);

      setState((prev) => ({
        ...prev,
        isUploading: true,
        uploadProgress: 0,
        error: null,
      }));

      try {
        await uploadVideo(state.sessionId, file, (progress) => {
          setState((prev) => ({
            ...prev,
            uploadProgress: progress,
          }));
        });

        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
        }));

        // Auto-trigger analysis after successful upload
        await handleTriggerAnalysis();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        }));
      }
    },
    [state.sessionId, handleTriggerAnalysis]
  );

  /**
   * Update analysis with user edits
   */
  const handleUpdateAnalysis = useCallback(
    async (editedText: string) => {
      if (!state.sessionId) {
        setState((prev) => ({
          ...prev,
          error: 'No active session. Please refresh the page.',
        }));
        return;
      }

      try {
        const updatedAnalysis = await updateAnalysis(
          state.sessionId,
          editedText
        );

        setState((prev) => ({
          ...prev,
          analysis: updatedAnalysis,
          currentStep: 'product-input', // Move to next step after saving
        }));
      } catch (error) {
        // Check if it's a session not found error
        const errorMessage = error instanceof Error ? error.message : 'Failed to update analysis';
        
        if (errorMessage.includes('Session not found') || errorMessage.includes('not found')) {
          // Clear invalid session
          localStorage.removeItem('sessionId');
          setState((prev) => ({
            ...prev,
            error: 'Session expired. Please refresh the page and upload your video again.',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: errorMessage,
          }));
        }
      }
    },
    [state.sessionId]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Submit product information
   */
  const handleSubmitProductInfo = useCallback(
    async (productName: string, productDescription: string) => {
      if (!state.sessionId) {
        setState((prev) => ({
          ...prev,
          error: 'No active session. Please refresh the page.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSubmittingProduct: true,
        error: null,
      }));

      try {
        await submitProductInfo(
          state.sessionId,
          productName,
          productDescription
        );

        setState((prev) => ({
          ...prev,
          isSubmittingProduct: false,
          productName,
          productDescription,
          currentStep: 'prompt-generation',
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to submit product information';

        if (
          errorMessage.includes('Session not found') ||
          errorMessage.includes('not found')
        ) {
          localStorage.removeItem('sessionId');
          setState((prev) => ({
            ...prev,
            isSubmittingProduct: false,
            error:
              'Session expired. Please refresh the page and start over.',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isSubmittingProduct: false,
            error: errorMessage,
          }));
        }
      }
    },
    [state.sessionId]
  );

  return {
    ...state,
    uploadVideo: handleUploadVideo,
    triggerAnalysis: handleTriggerAnalysis,
    updateAnalysis: handleUpdateAnalysis,
    submitProductInfo: handleSubmitProductInfo,
    clearError,
  };
}
