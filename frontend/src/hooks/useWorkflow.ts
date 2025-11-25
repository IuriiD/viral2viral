import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createSession,
  uploadVideo,
  triggerAnalysis,
  getAnalysisStatus,
  updateAnalysis,
  submitProductInfo,
  generatePrompt,
  updatePrompt,
  approvePrompt,
  uploadProductImage,
  generateVideo,
  getVideoStatus,
  VideoAnalysis,
  GenerationPrompt,
  GeneratedVideo,
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
  prompt: GenerationPrompt | null;
  isGeneratingPrompt: boolean;
  isUpdatingPrompt: boolean;
  isApprovingPrompt: boolean;
  productImage: File | null;
  productImagePreview: string | null;
  isUploadingImage: boolean;
  imageUploadProgress: number;
  generatedVideo: GeneratedVideo | null;
  isGeneratingVideo: boolean;
  originalVideoUrl: string | null;
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
    prompt: null,
    isGeneratingPrompt: false,
    isUpdatingPrompt: false,
    isApprovingPrompt: false,
    productImage: null,
    productImagePreview: null,
    isUploadingImage: false,
    imageUploadProgress: 0,
    generatedVideo: null,
    isGeneratingVideo: false,
    originalVideoUrl: null,
    error: null,
  });

  const videoPollingInterval = useRef<number | null>(null);

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

  /**
   * Generate prompt from analysis and product info
   */
  const handleGeneratePrompt = useCallback(async () => {
    if (!state.sessionId) {
      setState((prev) => ({
        ...prev,
        error: 'No active session. Please refresh the page.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isGeneratingPrompt: true,
      error: null,
    }));

    try {
      const generatedPrompt = await generatePrompt(state.sessionId);

      setState((prev) => ({
        ...prev,
        isGeneratingPrompt: false,
        prompt: generatedPrompt,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate prompt';

      if (
        errorMessage.includes('Session not found') ||
        errorMessage.includes('not found')
      ) {
        localStorage.removeItem('sessionId');
        setState((prev) => ({
          ...prev,
          isGeneratingPrompt: false,
          error: 'Session expired. Please refresh the page and start over.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isGeneratingPrompt: false,
          error: errorMessage,
        }));
      }
    }
  }, [state.sessionId]);

  /**
   * Update prompt with user edits
   */
  const handleUpdatePrompt = useCallback(
    async (editedText: string) => {
      if (!state.sessionId) {
        setState((prev) => ({
          ...prev,
          error: 'No active session. Please refresh the page.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isUpdatingPrompt: true,
        error: null,
      }));

      try {
        const updatedPrompt = await updatePrompt(state.sessionId, editedText);

        setState((prev) => ({
          ...prev,
          isUpdatingPrompt: false,
          prompt: updatedPrompt,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update prompt';

        if (
          errorMessage.includes('Session not found') ||
          errorMessage.includes('not found')
        ) {
          localStorage.removeItem('sessionId');
          setState((prev) => ({
            ...prev,
            isUpdatingPrompt: false,
            error: 'Session expired. Please refresh the page and start over.',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isUpdatingPrompt: false,
            error: errorMessage,
          }));
        }
      }
    },
    [state.sessionId]
  );

  /**
   * Approve prompt for video generation
   */
  const handleApprovePrompt = useCallback(async () => {
    if (!state.sessionId) {
      setState((prev) => ({
        ...prev,
        error: 'No active session. Please refresh the page.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isApprovingPrompt: true,
      error: null,
    }));

    try {
      const approvedPrompt = await approvePrompt(state.sessionId);

      setState((prev) => ({
        ...prev,
        isApprovingPrompt: false,
        prompt: approvedPrompt,
        currentStep: 'video-generation', // Move to next step after approval
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to approve prompt';

      if (
        errorMessage.includes('Session not found') ||
        errorMessage.includes('not found')
      ) {
        localStorage.removeItem('sessionId');
        setState((prev) => ({
          ...prev,
          isApprovingPrompt: false,
          error: 'Session expired. Please refresh the page and start over.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isApprovingPrompt: false,
          error: errorMessage,
        }));
      }
    }
  }, [state.sessionId]);

  /**
   * Handle product image selection
   */
  const handleImageSelect = useCallback((file: File) => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    setState((prev) => ({
      ...prev,
      productImage: file,
      productImagePreview: previewUrl,
    }));
  }, []);

  /**
   * Upload product image
   */
  const handleUploadProductImage = useCallback(async () => {
    if (!state.sessionId || !state.productImage) {
      setState((prev) => ({
        ...prev,
        error: 'No image selected or session not ready.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isUploadingImage: true,
      imageUploadProgress: 0,
      error: null,
    }));

    try {
      await uploadProductImage(state.sessionId, state.productImage, (progress) => {
        setState((prev) => ({
          ...prev,
          imageUploadProgress: progress,
        }));
      });

      setState((prev) => ({
        ...prev,
        isUploadingImage: false,
        imageUploadProgress: 100,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image';

      setState((prev) => ({
        ...prev,
        isUploadingImage: false,
        error: errorMessage,
      }));
    }
  }, [state.sessionId, state.productImage]);

  /**
   * Generate video using Sora 2
   */
  const handleGenerateVideo = useCallback(async () => {
    if (!state.sessionId) {
      setState((prev) => ({
        ...prev,
        error: 'No active session. Please refresh the page.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isGeneratingVideo: true,
      error: null,
    }));

    try {
      const video = await generateVideo(state.sessionId);

      setState((prev) => ({
        ...prev,
        generatedVideo: video,
      }));

      // Start polling for video status
      if (videoPollingInterval.current) {
        clearInterval(videoPollingInterval.current);
      }

      videoPollingInterval.current = setInterval(async () => {
        try {
          const status = await getVideoStatus(state.sessionId!);

          setState((prev) => ({
            ...prev,
            generatedVideo: status,
          }));

          if (status.status === 'complete') {
            if (videoPollingInterval.current) {
              clearInterval(videoPollingInterval.current);
              videoPollingInterval.current = null;
            }
            setState((prev) => ({
              ...prev,
              isGeneratingVideo: false,
              currentStep: 'complete',
            }));
          } else if (status.status === 'failed') {
            if (videoPollingInterval.current) {
              clearInterval(videoPollingInterval.current);
              videoPollingInterval.current = null;
            }
            setState((prev) => ({
              ...prev,
              isGeneratingVideo: false,
              error: status.error?.message || 'Video generation failed',
            }));
          }
        } catch (error) {
          console.error('Error checking video status:', error);
          if (videoPollingInterval.current) {
            clearInterval(videoPollingInterval.current);
            videoPollingInterval.current = null;
          }
          setState((prev) => ({
            ...prev,
            isGeneratingVideo: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to check video status',
          }));
        }
      }, 4000); // Poll every 4 seconds (within 3-5 second range)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to start video generation';

      if (
        errorMessage.includes('Session not found') ||
        errorMessage.includes('not found')
      ) {
        localStorage.removeItem('sessionId');
        setState((prev) => ({
          ...prev,
          isGeneratingVideo: false,
          error: 'Session expired. Please refresh the page and start over.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isGeneratingVideo: false,
          error: errorMessage,
        }));
      }
    }
  }, [state.sessionId]);

  /**
   * Cleanup polling on unmount
   */
  useEffect(() => {
    return () => {
      if (videoPollingInterval.current) {
        clearInterval(videoPollingInterval.current);
      }
    };
  }, []);

  return {
    ...state,
    uploadVideo: handleUploadVideo,
    triggerAnalysis: handleTriggerAnalysis,
    updateAnalysis: handleUpdateAnalysis,
    submitProductInfo: handleSubmitProductInfo,
    generatePrompt: handleGeneratePrompt,
    updatePrompt: handleUpdatePrompt,
    approvePrompt: handleApprovePrompt,
    selectProductImage: handleImageSelect,
    uploadProductImage: handleUploadProductImage,
    generateVideo: handleGenerateVideo,
    clearError,
  };
}
