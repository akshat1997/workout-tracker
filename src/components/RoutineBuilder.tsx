import React, { useState } from 'react';
import { useRoutines, useExercises } from '../hooks/useWorkoutData';
import type { WorkoutRoutine, ExerciseInWorkout, WorkoutSet, Exercise } from '../types';
import { generateId, getDayName } from '../utils';

export const RoutineBuilder: React.FC = () => {
  const { routines, createRoutine, updateRoutine, deleteRoutine } = useRoutines();
  const { exercises, addExercise } = useExercises();
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExerciseResults, setShowExerciseResults] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    dayOfWeek: number[];
    exercises: ExerciseInWorkout[];
  }>({
    name: '',
    dayOfWeek: [],
    exercises: []
  });
  const [weightEdits, setWeightEdits] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      dayOfWeek: [],
      exercises: []
    });
    setEditingRoutine(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.exercises.length > 0) {
      const routine: WorkoutRoutine = {
        id: editingRoutine?.id || generateId(),
        name: formData.name.trim(),
        exercises: formData.exercises,
        dayOfWeek: formData.dayOfWeek,
        createdAt: editingRoutine?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (editingRoutine) {
        await updateRoutine(routine);
      } else {
        await createRoutine(routine);
      }
      resetForm();
    }
  };

  const addExerciseToRoutine = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    appendExerciseToForm(exercise);
  };

  const appendExerciseToForm = (exercise: Exercise) => {
    const newExercise: ExerciseInWorkout = {
      id: generateId(),
      exerciseId: exercise.id,
      sets: Array.from({ length: 3 }).map(() => ({
        id: generateId(),
        reps: 10,
        weight: 0,
        unit: 'lb' as const,
        completed: false,
      }))
    };
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise]
    });
  };

  const addManualExerciseFromSearch = async () => {
    const name = exerciseSearch.trim();
    if (!name) return;
    const newEx: Exercise = { id: generateId(), name };
    await addExercise(newEx);
    appendExerciseToForm(newEx);
    setExerciseSearch('');
    setShowExerciseResults(false);
  };

  const removeExerciseFromRoutine = (exerciseInWorkoutId: string) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter(e => e.id !== exerciseInWorkoutId)
    });
  };

  const addSetToExercise = (exerciseInWorkoutId: string) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.map(exercise => {
        if (exercise.id === exerciseInWorkoutId) {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          const newSet: WorkoutSet = {
            id: generateId(),
            reps: lastSet?.reps || 10,
            weight: lastSet?.weight || 0,
            unit: lastSet?.unit || 'lb',
            completed: false
          };
          return {
            ...exercise,
            sets: [...exercise.sets, newSet]
          };
        }
        return exercise;
      })
    });
  };

  const removeSetFromExercise = (exerciseInWorkoutId: string, setId: string) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.map(exercise => {
        if (exercise.id === exerciseInWorkoutId) {
          return {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId)
          };
        }
        return exercise;
      })
    });
  };

  const updateSet = (exerciseInWorkoutId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.map(exercise => {
        if (exercise.id === exerciseInWorkoutId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => {
              if (set.id === setId) {
                return { ...set, ...updates };
              }
              return set;
            })
          };
        }
        return exercise;
      })
    });
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData({
      ...formData,
      dayOfWeek: formData.dayOfWeek.includes(day)
        ? formData.dayOfWeek.filter(d => d !== day)
        : [...formData.dayOfWeek, day]
    });
  };

  const startEdit = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setFormData({
      name: routine.name,
      dayOfWeek: routine.dayOfWeek || [],
      exercises: routine.exercises
    });
    setShowForm(true);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Workout Routines</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Routine'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-800 p-6 rounded-lg">
          <div className="mb-4">
            <label htmlFor="routineName" className="block text-sm font-medium text-gray-300 mb-2">
              Routine Name *
            </label>
            <input
              type="text"
              id="routineName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Upper Body Day"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDayOfWeek(day)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    formData.dayOfWeek.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {getDayName(day).slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exercises *
            </label>
            {exercises.length > 0 && (
              <div className="mb-4 relative">
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => { setExerciseSearch(e.target.value); setShowExerciseResults(Boolean(e.target.value.trim())); }}
                  onFocus={() => setShowExerciseResults(Boolean(exerciseSearch.trim()))}
                  onBlur={() => setTimeout(() => setShowExerciseResults(false), 120)}
                  placeholder="Search and add an exercise..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showExerciseResults && exerciseSearch && (
                  <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg bg-gray-800 shadow-lg border border-gray-700">
                    {(() => {
                      const matches = exercises
                        .filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                        .slice(0, 50);
                      return (
                        <>
                          {matches.map(ex => (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => { addExerciseToRoutine(ex.id); setExerciseSearch(''); setShowExerciseResults(false); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white"
                            >
                              <div className="font-medium">{ex.name}</div>
                              {ex.muscleGroup && <div className="text-xs text-gray-400">{ex.muscleGroup}</div>}
                            </button>
                          ))}
                          {matches.length === 0 && (
                            <>
                              <div className="px-3 py-2 text-gray-400 text-sm">No matches</div>
                              <button
                                type="button"
                                onClick={addManualExerciseFromSearch}
                                className="w-full text-left px-3 py-2 bg-blue-600 text-white hover:bg-blue-500"
                              >
                                Add “{exerciseSearch.trim()}”
                              </button>
                            </>
                          )}
                          {matches.length > 0 && !matches.some(m => m.name.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={addManualExerciseFromSearch}
                              className="w-full text-left px-3 py-2 bg-blue-600 text-white hover:bg-blue-500"
                            >
                              Add “{exerciseSearch.trim()}”
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {formData.exercises.map((exerciseInWorkout) => {
                const exercise = exercises.find(e => e.id === exerciseInWorkout.exerciseId);
                return (
                  <div key={exerciseInWorkout.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-semibold">{exercise?.name}</h4>
                      <button
                        type="button"
                        onClick={() => removeExerciseFromRoutine(exerciseInWorkout.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {exerciseInWorkout.sets.map((set, setIndex) => (
                        <div key={set.id} className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm w-12">Set {setIndex + 1}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={String(set.reps)}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g,'');
                              updateSet(exerciseInWorkout.id, set.id, { reps: v === '' ? 0 : parseInt(v) });
                            }}
                            className="w-20 px-2 py-1 bg-gray-600 text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Reps"
                          />
                          <span className="text-gray-400">×</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={weightEdits[set.id] ?? String(set.weight)}
                            onFocus={() => {
                              setWeightEdits(prev => (
                                prev[set.id] === undefined ? { ...prev, [set.id]: String(set.weight) } : prev
                              ));
                            }}
                            onChange={(e) => setWeightEdits(prev => ({ ...prev, [set.id]: e.target.value.replace(/,/g, '.') }))}
                            onBlur={() => {
                              const v = weightEdits[set.id];
                              if (v !== undefined) {
                                const parsed = v.trim() === '' ? 0 : parseFloat(v);
                                updateSet(exerciseInWorkout.id, set.id, { weight: Number.isNaN(parsed) ? 0 : parsed });
                                setWeightEdits(prev => { const cp = { ...prev }; delete cp[set.id]; return cp; });
                              }
                            }}
                            className="w-20 px-2 py-1 bg-gray-600 text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Weight"
                          />
                          <select
                            value={set.unit}
                            onChange={(e) => updateSet(exerciseInWorkout.id, set.id, { unit: e.target.value as 'kg' | 'lb' })}
                            className="px-2 py-1 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="lb">lb</option>
                            <option value="kg">kg</option>
                          </select>
                          {exerciseInWorkout.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSetFromExercise(exerciseInWorkout.id, set.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => addSetToExercise(exerciseInWorkout.id)}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + Add Set
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!formData.name.trim() || formData.exercises.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {editingRoutine ? 'Update Routine' : 'Create Routine'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {routines.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No routines created yet.</p>
        ) : (
          routines.map((routine) => (
            <div key={routine.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-semibold text-lg">{routine.name}</h3>
                  {routine.dayOfWeek && routine.dayOfWeek.length > 0 && (
                    <p className="text-gray-400 text-sm">
                      {routine.dayOfWeek.map(day => getDayName(day).slice(0, 3)).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(routine)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-gray-300 text-sm">
                {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
