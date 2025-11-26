interface ProgressIndicatorProps {
  currentStep: number;
  steps: string[];
}

/**
 * ProgressIndicator Component
 *
 * Displays workflow progress across multiple steps
 */
export function ProgressIndicator({
  currentStep,
  steps,
}: ProgressIndicatorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Workflow Progress</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <p
                className={`text-xs mt-2 text-center ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`absolute top-5 w-full h-0.5 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{ left: '62%' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
