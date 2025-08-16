import { useState, useEffect } from 'react';
import { ExerciseManager } from './components/ExerciseManager';
import { RoutineBuilder } from './components/RoutineBuilder';
import { ActiveWorkout } from './components/ActiveWorkout';
import { ProgressTracker } from './components/ProgressTracker';
import { db } from './db';

type Tab = 'workout' | 'exercises' | 'routines' | 'progress';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      await db.init();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">Workout Tracker</h1>
          <nav className="flex justify-around">
            {[
              { id: 'workout', label: 'Workout', icon: '💪' },
              { id: 'exercises', label: 'Exercises', icon: '🏋️' },
              { id: 'routines', label: 'Routines', icon: '📋' },
              { id: 'progress', label: 'Progress', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-2xl mb-1">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'workout' && <ActiveWorkout />}
        {activeTab === 'exercises' && <ExerciseManager />}
        {activeTab === 'routines' && <RoutineBuilder />}
        {activeTab === 'progress' && <ProgressTracker />}
      </main>
    </div>
  );
}

export default App;
