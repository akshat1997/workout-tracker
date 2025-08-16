import React, { useState, useEffect } from 'react';
import { useRoutines, useSessions, useExercises } from '../hooks/useWorkoutData';
import type { WorkoutRoutine, WorkoutSession, WorkoutSet } from '../types';
import { generateId, convertWeight } from '../utils';
import { RestTimer } from './RestTimer';
import { db } from '../db';

export const ActiveWorkout: React.FC = () => {
  const { routines, getTodaysRoutines } = useRoutines();
  const { createSession, updateSession } = useSessions();
  const { exercises } = useExercises();
  const [todaysRoutines, setTodaysRoutines] = useState<WorkoutRoutine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'lb'>('lb');
  const [weightEdits, setWeightEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTodaysRoutines();
  }, []);

  const loadTodaysRoutines = async () => {
    const routines = await getTodaysRoutines();
    setTodaysRoutines(routines);
  };

  const startWorkout = async (routine: WorkoutRoutine) => {
    const exercisesWithHistory = await Promise.all(
      routine.exercises.map(async (exercise) => {
        const last = await db.getLatestProgressForExercise(exercise.exerciseId);
        let initialSets = exercise.sets;
        if (last && last.sets.length > 0) {
          initialSets = last.sets.map((s) => ({
            id: generateId(),
            reps: s.reps,
            weight: s.weight,
            unit: s.unit,
            completed: false,
          }));
        } else if (!exercise.sets || exercise.sets.length === 0) {
          initialSets = Array.from({ length: 3 }).map(() => ({
            id: generateId(),
            reps: 10,
            weight: 0,
            unit: 'lb' as const,
            completed: false,
          }));
        } else {
          initialSets = exercise.sets.map((set) => ({
            ...set,
            id: generateId(),
            completed: false,
          }));
        }

        return { ...exercise, sets: initialSets };
      })
    );

    const session: WorkoutSession = {
      id: generateId(),
      routineId: routine.id,
      exercises: exercisesWithHistory,
      startTime: new Date(),
      notes: '',
    };

    setActiveSession(session);
    setSelectedRoutine(routine);
    await createSession(session);
  };

  const toggleSetComplete = async (exerciseId: string, setId: string) => {
    if (!activeSession) return;

    const updatedSession = {
      ...activeSession,
      exercises: activeSession.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => {
              if (set.id === setId) {
                const isCompleting = !set.completed;
                if (isCompleting) {
                  setShowRestTimer(true);
                }
                return { ...set, completed: !set.completed };
              }
              return set;
            })
          };
        }
        return exercise;
      })
    };

    setActiveSession(updatedSession);
    await updateSession(updatedSession);
  };

  const updateSetValue = async (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    if (!activeSession) return;

    const updatedSession = {
      ...activeSession,
      exercises: activeSession.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => {
              if (set.id === setId) {
                return { ...set, [field]: value };
              }
              return set;
            })
          };
        }
        return exercise;
      })
    };

    setActiveSession(updatedSession);
    await updateSession(updatedSession);
  };

  const addSetDuringWorkout = async (exerciseId: string) => {
    if (!activeSession) return;
    const updatedSession = {
      ...activeSession,
      exercises: activeSession.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const last = exercise.sets[exercise.sets.length - 1];
        const newSet: WorkoutSet = {
          id: generateId(),
          reps: last?.reps ?? 10,
          weight: last?.weight ?? 0,
          unit: last?.unit ?? 'lb',
          completed: false,
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      }),
    };
    setActiveSession(updatedSession);
    await updateSession(updatedSession);
  };

  const removeSetDuringWorkout = async (exerciseId: string, setId: string) => {
    if (!activeSession) return;
    const updatedSession = {
      ...activeSession,
      exercises: activeSession.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return { ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) };
      }),
    };
    setActiveSession(updatedSession);
    await updateSession(updatedSession);
  };

  const finishWorkout = async () => {
    if (!activeSession) return;

    const completedSession = {
      ...activeSession,
      endTime: new Date()
    };

    await updateSession(completedSession);

    // Save progress records
    for (const exercise of completedSession.exercises) {
      const completedSets = exercise.sets.filter(set => set.completed);
      if (completedSets.length > 0) {
        const progress = {
          id: generateId(),
          exerciseId: exercise.exerciseId,
          sessionId: completedSession.id,
          date: new Date(),
          sets: completedSets.map(set => ({
            reps: set.reps,
            weight: set.weight,
            unit: set.unit
          }))
        } as const;
        await db.saveProgress(progress as any);
      }
    }

    setActiveSession(null);
    setSelectedRoutine(null);
  };

  const getDisplayWeight = (weight: number, setUnit: 'kg' | 'lb'): number => {
    return convertWeight(weight, setUnit, unit);
  };

  if (!activeSession) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Start Workout</h2>
        
        {todaysRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Today's Routines</h3>
            <div className="space-y-2">
              {todaysRoutines.map(routine => (
                <button
                  key={routine.id}
                  onClick={() => startWorkout(routine)}
                  className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="font-semibold">{routine.name}</div>
                  <div className="text-sm text-blue-200">
                    {routine.exercises.length} exercises
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3">All Routines</h3>
          <div className="space-y-2">
            {routines.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No routines created yet.</p>
            ) : (
              routines.map(routine => (
                <button
                  key={routine.id}
                  onClick={() => startWorkout(routine)}
                  className="w-full text-left bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="font-semibold">{routine.name}</div>
                  <div className="text-sm text-gray-400">
                    {routine.exercises.length} exercises
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalSets = activeSession.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = activeSession.exercises.reduce((sum, ex) => 
    sum + ex.sets.filter(set => set.completed).length, 0
  );
  const progress = (completedSets / totalSets) * 100;

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{selectedRoutine?.name}</h2>
        <button
          onClick={finishWorkout}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Finish Workout
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-400">{completedSets}/{totalSets} sets</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-gray-300">Weight Unit:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setUnit('lb')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              unit === 'lb'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            lb
          </button>
          <button
            onClick={() => setUnit('kg')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              unit === 'kg'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            kg
          </button>
        </div>
      </div>

      {showRestTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setShowRestTimer(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RestTimer onComplete={() => setShowRestTimer(false)} />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {activeSession.exercises.map((exerciseInWorkout) => {
          const exercise = exercises.find(e => e.id === exerciseInWorkout.exerciseId);
          const exerciseCompleted = exerciseInWorkout.sets.every(set => set.completed);
          
          return (
            <div 
              key={exerciseInWorkout.id} 
              className={`bg-gray-800 p-4 rounded-lg ${exerciseCompleted ? 'opacity-75' : ''}`}
            >
              <h3 className="text-white font-semibold text-lg mb-3 flex items-center">
                {exercise?.name}
                {exerciseCompleted && (
                  <svg className="w-5 h-5 ml-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </h3>
              
              <div className="space-y-2">
                {exerciseInWorkout.sets.map((set, setIndex) => (
                  <div key={set.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSetComplete(exerciseInWorkout.id, set.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        set.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {set.completed && (
                        <svg className="w-4 h-4 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    
                    <span className="text-gray-400 text-sm w-12">Set {setIndex + 1}</span>
                    
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSetValue(exerciseInWorkout.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-gray-700 text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    
                    <span className="text-gray-400">×</span>
                    
                    <input
                      type="text"
                      inputMode="decimal"
                      value={weightEdits[set.id] ?? getDisplayWeight(set.weight, set.unit).toFixed(1)}
                      onFocus={() => {
                        setWeightEdits(prev => (
                          prev[set.id] === undefined
                            ? { ...prev, [set.id]: getDisplayWeight(set.weight, set.unit).toFixed(1) }
                            : prev
                        ));
                      }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/,/g, '.');
                        setWeightEdits(prev => ({ ...prev, [set.id]: v }));
                      }}
                      onBlur={() => {
                        const v = weightEdits[set.id];
                        if (v !== undefined) {
                          const parsed = v.trim() === '' ? 0 : parseFloat(v);
                          if (!Number.isNaN(parsed)) {
                            const storedWeight = convertWeight(parsed, unit, set.unit);
                            updateSetValue(exerciseInWorkout.id, set.id, 'weight', storedWeight);
                          }
                          setWeightEdits(prev => { const cp = { ...prev }; delete cp[set.id]; return cp; });
                        }
                      }}
                      className="w-20 px-2 py-1 bg-gray-700 text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <span className="text-gray-400">{unit}</span>
                    {exerciseInWorkout.sets.length > 1 && (
                      <button
                        onClick={() => removeSetDuringWorkout(exerciseInWorkout.id, set.id)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addSetDuringWorkout(exerciseInWorkout.id)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                + Add Set
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
