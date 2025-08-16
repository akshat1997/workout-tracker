import { useState, useEffect } from 'react';
import { db } from '../db';
import { fetchWgerExercises } from '../services/wger';
import { fetchFreeExerciseDb } from '../services/freeExerciseDb';
import { seedExercises } from '../services/seedExercises';
import type { Exercise, WorkoutRoutine, WorkoutSession } from '../types';

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await db.getExercises();
      if (data.length === 0) {
        // Auto-import a starter set when empty
        try {
          let imported = await fetchFreeExerciseDb(300);
          if (!imported || imported.length === 0) {
            imported = await fetchWgerExercises(100);
          }
          if (!imported || imported.length === 0) {
            imported = seedExercises.map(s => ({ externalId: 'seed', name: s.name, muscleGroup: s.muscleGroup }));
          }
          for (const item of imported) {
            await db.createExercise({ id: `${item.externalId}-${Math.random().toString(36).slice(2,7)}`, name: item.name, muscleGroup: item.muscleGroup });
          }
          await db.dedupeExercisesByName();
          const fresh = await db.getExercises();
          setExercises(fresh);
        } catch (e) {
          // final fallback: seed list
          for (const s of seedExercises) {
            await db.createExercise({ id: `seed-${Math.random().toString(36).slice(2,7)}` , name: s.name, muscleGroup: s.muscleGroup });
          }
          await db.dedupeExercisesByName();
          const fresh = await db.getExercises();
          setExercises(fresh);
        }
      } else {
        await db.dedupeExercisesByName();
        setExercises(await db.getExercises());
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async (exercise: Exercise) => {
    await db.createExercise(exercise);
    await loadExercises();
  };

  const deleteExercise = async (id: string) => {
    await db.deleteExercise(id);
    await loadExercises();
  };

  return { exercises, loading, addExercise, deleteExercise, refetch: loadExercises };
};

export const useRoutines = () => {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const data = await db.getRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoutine = async (routine: WorkoutRoutine) => {
    await db.createRoutine(routine);
    await loadRoutines();
  };

  const updateRoutine = async (routine: WorkoutRoutine) => {
    await db.updateRoutine(routine);
    await loadRoutines();
  };

  const deleteRoutine = async (id: string) => {
    await db.deleteRoutine(id);
    await loadRoutines();
  };

  const getTodaysRoutines = async () => {
    const today = new Date().getDay();
    return await db.getRoutinesForDay(today);
  };

  return { 
    routines, 
    loading, 
    createRoutine, 
    updateRoutine, 
    deleteRoutine, 
    getTodaysRoutines,
    refetch: loadRoutines 
  };
};

export const useSessions = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      const data = await db.getRecentSessions(20);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (session: WorkoutSession) => {
    await db.createSession(session);
    await loadRecentSessions();
  };

  const updateSession = async (session: WorkoutSession) => {
    await db.updateSession(session);
    await loadRecentSessions();
  };

  return { 
    sessions, 
    loading, 
    createSession, 
    updateSession,
    refetch: loadRecentSessions 
  };
};
