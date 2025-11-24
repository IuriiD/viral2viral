/**
 * Main App Component
 *
 * Root component with basic layout and Tailwind styles.
 * Will be extended with workflow components in later phases.
 */

function App() {
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to UGC Video Generator
            </h2>
            <p className="text-gray-600">
              The workflow components will be added in the next phase.
            </p>
          </div>
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
