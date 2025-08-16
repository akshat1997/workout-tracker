import React, { useState } from 'react';
import { useExercises } from '../hooks/useWorkoutData';
import type { Exercise } from '../types';
import { generateId } from '../utils';
import { fetchWgerExercises } from '../services/wger';
import { fetchFreeExerciseDb } from '../services/freeExerciseDb';
import { seedExercises } from '../services/seedExercises';

export const ExerciseManager: React.FC = () => {
  const { exercises, loading, addExercise, deleteExercise } = useExercises();
  const [showForm, setShowForm] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroup: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExercise.name.trim()) {
      const exercise: Exercise = {
        id: generateId(),
        name: newExercise.name.trim(),
        muscleGroup: newExercise.muscleGroup.trim() || undefined
      };
      await addExercise(exercise);
      setNewExercise({ name: '', muscleGroup: '' });
      setShowForm(false);
    }
  };

  const importFromWger = async () => {
    try {
      // Primary: Free Exercise DB
      let imported = await fetchFreeExerciseDb(300);
      // Fallback to WGER if needed
      if (!imported || imported.length === 0) {
        imported = await fetchWgerExercises(200);
      }
      if (!imported || imported.length === 0) {
        imported = seedExercises.map(s => ({ externalId: 'seed', name: s.name, muscleGroup: s.muscleGroup }));
      }
      const existingByName = new Set(exercises.map(e => e.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')));
      let added = 0;
      for (const item of imported) {
        const key = item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        if (existingByName.has(key)) continue;
        const exercise: Exercise = {
          id: generateId(),
          name: item.name,
          muscleGroup: item.muscleGroup,
        };
        await addExercise(exercise);
        existingByName.add(key);
        added++;
        if (added >= 100) break;
      }
      alert(`${added} exercises imported`);
    } catch (err) {
      // fallback to seed list if network fails entirely
      const existingByName = new Set(exercises.map(e => e.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')));
      let added = 0;
      for (const s of seedExercises) {
        const key = s.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        if (existingByName.has(key)) continue;
        const exercise: Exercise = { id: generateId(), name: s.name, muscleGroup: s.muscleGroup };
        await addExercise(exercise);
        existingByName.add(key);
        added++;
      }
      alert(`${added} exercises imported (seed list)`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading exercises...</div>;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Exercises</h2>
        <div className="flex gap-2">
          <button
            onClick={importFromWger}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-800 p-4 rounded-lg">
          <div className="mb-4">
            <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-300 mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              id="exerciseName"
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Bench Press"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-300 mb-2">
              Muscle Group
            </label>
            <input
              type="text"
              id="muscleGroup"
              value={newExercise.muscleGroup}
              onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chest"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Add Exercise
          </button>
        </form>
      )}

      <div className="space-y-2">
        {exercises.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No exercises added yet.</p>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex justify-between items-center bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <div>
                <h3 className="text-white font-semibold">{exercise.name}</h3>
                {exercise.muscleGroup && (
                  <p className="text-gray-400 text-sm">{exercise.muscleGroup}</p>
                )}
              </div>
              <button
                onClick={() => deleteExercise(exercise.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
