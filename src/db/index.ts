import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Exercise, WorkoutRoutine, WorkoutSession, ProgressRecord } from '../types';

interface WorkoutDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-name': string };
  };
  workoutRoutines: {
    key: string;
    value: WorkoutRoutine;
    indexes: { 'by-date': Date };
  };
  workoutSessions: {
    key: string;
    value: WorkoutSession;
    indexes: { 'by-date': Date; 'by-routine': string };
  };
  progressRecords: {
    key: string;
    value: ProgressRecord;
    indexes: { 'by-date': Date; 'by-exercise': string };
  };
}

class WorkoutDatabase {
  private db: IDBPDatabase<WorkoutDB> | null = null;

  async init() {
    this.db = await openDB<WorkoutDB>('workout-tracker', 1, {
      upgrade(db) {
        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
        exerciseStore.createIndex('by-name', 'name');

        const routineStore = db.createObjectStore('workoutRoutines', { keyPath: 'id' });
        routineStore.createIndex('by-date', 'updatedAt');

        const sessionStore = db.createObjectStore('workoutSessions', { keyPath: 'id' });
        sessionStore.createIndex('by-date', 'startTime');
        sessionStore.createIndex('by-routine', 'routineId');

        const progressStore = db.createObjectStore('progressRecords', { keyPath: 'id' });
        progressStore.createIndex('by-date', 'date');
        progressStore.createIndex('by-exercise', 'exerciseId');
      },
    });
  }

  private async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  }

  async dedupeExercisesByName(): Promise<number> {
    const db = await this.ensureDB();
    const all = await db.getAll('exercises');
    const seen = new Set<string>();
    const toDelete: string[] = [];
    for (const ex of all) {
      const key = this.normalizeName(ex.name);
      if (seen.has(key)) {
        toDelete.push(ex.id);
      } else {
        seen.add(key);
      }
    }
    for (const id of toDelete) {
      await db.delete('exercises', id);
    }
    return toDelete.length;
  }

  // Exercise CRUD operations
  async createExercise(exercise: Exercise): Promise<void> {
    const db = await this.ensureDB();
    await db.put('exercises', exercise);
  }

  async getExercises(): Promise<Exercise[]> {
    const db = await this.ensureDB();
    return db.getAll('exercises');
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const db = await this.ensureDB();
    return db.get('exercises', id);
  }

  async deleteExercise(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('exercises', id);
  }

  // Workout Routine CRUD operations
  async createRoutine(routine: WorkoutRoutine): Promise<void> {
    const db = await this.ensureDB();
    await db.put('workoutRoutines', routine);
  }

  async getRoutines(): Promise<WorkoutRoutine[]> {
    const db = await this.ensureDB();
    return db.getAll('workoutRoutines');
  }

  async getRoutine(id: string): Promise<WorkoutRoutine | undefined> {
    const db = await this.ensureDB();
    return db.get('workoutRoutines', id);
  }

  async updateRoutine(routine: WorkoutRoutine): Promise<void> {
    const db = await this.ensureDB();
    routine.updatedAt = new Date();
    await db.put('workoutRoutines', routine);
  }

  async deleteRoutine(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('workoutRoutines', id);
  }

  async getRoutinesForDay(dayOfWeek: number): Promise<WorkoutRoutine[]> {
    const db = await this.ensureDB();
    const allRoutines = await db.getAll('workoutRoutines');
    return allRoutines.filter(routine => 
      routine.dayOfWeek?.includes(dayOfWeek)
    );
  }

  // Workout Session CRUD operations
  async createSession(session: WorkoutSession): Promise<void> {
    const db = await this.ensureDB();
    await db.put('workoutSessions', session);
  }

  async getSession(id: string): Promise<WorkoutSession | undefined> {
    const db = await this.ensureDB();
    return db.get('workoutSessions', id);
  }

  async updateSession(session: WorkoutSession): Promise<void> {
    const db = await this.ensureDB();
    await db.put('workoutSessions', session);
  }

  async getSessionsByRoutine(routineId: string): Promise<WorkoutSession[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('workoutSessions', 'by-routine', routineId);
  }

  async getRecentSessions(limit: number = 10): Promise<WorkoutSession[]> {
    const db = await this.ensureDB();
    const sessions = await db.getAllFromIndex('workoutSessions', 'by-date');
    return sessions.reverse().slice(0, limit);
  }

  // Progress tracking
  async saveProgress(progress: ProgressRecord): Promise<void> {
    const db = await this.ensureDB();
    await db.put('progressRecords', progress);
  }

  async getProgressByExercise(exerciseId: string): Promise<ProgressRecord[]> {
    const db = await this.ensureDB();
    const records = await db.getAllFromIndex('progressRecords', 'by-exercise', exerciseId);
    return records
      .map((r) => ({
        ...r,
        date: r.date instanceof Date ? r.date : new Date(r.date as unknown as string),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getProgressInDateRange(startDate: Date, endDate: Date): Promise<ProgressRecord[]> {
    const db = await this.ensureDB();
    const allProgress = await db.getAllFromIndex('progressRecords', 'by-date');
    const normalized = allProgress.map((r) => ({
      ...r,
      date: r.date instanceof Date ? r.date : new Date(r.date as unknown as string),
    }));
    return normalized.filter(record => 
      record.date >= startDate && record.date <= endDate
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getLatestProgressForExercise(exerciseId: string): Promise<ProgressRecord | undefined> {
    const records = await this.getProgressByExercise(exerciseId);
    if (records.length === 0) return undefined;
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
}

export const db = new WorkoutDatabase();
