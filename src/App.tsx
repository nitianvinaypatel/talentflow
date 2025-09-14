// Main App component for TalentFlow hiring platform
import { ErrorBoundary } from "./components/layout/error-boundary";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">TalentFlow</h1>
          <p className="text-gray-600">
            Please use the routing system in main.tsx for the full application
            experience.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
