export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lb';
  completed: boolean;
  restTime?: number;
  completedAt?: Date;
}

export interface ExerciseInWorkout {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: ExerciseInWorkout[];
  dayOfWeek?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  exercises: ExerciseInWorkout[];
  startTime: Date;
  endTime?: Date;
  notes?: string;
}

export interface ProgressRecord {
  id: string;
  exerciseId: string;
  sessionId: string;
  date: Date;
  sets: {
    reps: number;
    weight: number;
    unit: 'kg' | 'lb';
    completedAt?: Date;
  }[];
}
