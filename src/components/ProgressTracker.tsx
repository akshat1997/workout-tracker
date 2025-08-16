import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../db';
import { useExercises } from '../hooks/useWorkoutData';
import type { ProgressRecord } from '../types';
import { format, subDays } from 'date-fns';
import { convertWeight } from '../utils';

export const ProgressTracker: React.FC = () => {
  const { exercises } = useExercises();
  const [progressByExercise, setProgressByExercise] = useState<Record<string, ProgressRecord[]>>({});
  const [chartsByExercise, setChartsByExercise] = useState<Record<string, any[]>>({});
  const [unit, setUnit] = useState<'kg' | 'lb'>('lb');
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    loadAllProgressData();
  }, [dateRange]);

  const loadAllProgressData = async () => {
    const endDate = new Date();
    const startDate = subDays(endDate, dateRange);
    const records = await db.getProgressInDateRange(startDate, endDate);
    const grouped: Record<string, ProgressRecord[]> = {};
    for (const r of records) {
      const key = r.exerciseId;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    setProgressByExercise(grouped);
    const charts: Record<string, any[]> = {};
    for (const [exerciseId, list] of Object.entries(grouped)) {
      charts[exerciseId] = buildChartData(list);
    }
    setChartsByExercise(charts);
  };

  const buildChartData = (records: ProgressRecord[]) => {
    return records.map(record => {
      const maxWeight = Math.max(
        ...record.sets.map(set => convertWeight(set.weight, set.unit, unit))
      );
      const totalVolume = record.sets.reduce((sum, set) =>
        sum + (set.reps * convertWeight(set.weight, set.unit, unit)), 0
      );
      const avgReps = record.sets.reduce((sum, set) => sum + set.reps, 0) / record.sets.length;

      return {
        date: format(new Date(record.date), 'MMM dd'),
        maxWeight: parseFloat(maxWeight.toFixed(1)),
        totalVolume: parseFloat(totalVolume.toFixed(1)),
        avgReps: parseFloat(avgReps.toFixed(1)),
        sets: record.sets.length
      };
    });
  };

  useEffect(() => {
    const charts: Record<string, any[]> = {};
    for (const [exerciseId, list] of Object.entries(progressByExercise)) {
      charts[exerciseId] = buildChartData(list);
    }
    setChartsByExercise(charts);
  }, [unit]);

  const exerciseNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of exercises) map[e.id] = e.name;
    return map;
  }, [exercises]);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Progress Tracking</h2>

      <div className="mb-6 flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
          <div className="flex gap-2">
            {[7, 30, 90, 180].map(days => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  dateRange === days ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {days < 30 ? `${days}d` : `${days / 30}mo`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Weight Unit</label>
          <div className="flex gap-2">
            <button
              onClick={() => setUnit('lb')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                unit === 'lb' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              lb
            </button>
            <button
              onClick={() => setUnit('kg')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                unit === 'kg' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              kg
            </button>
          </div>
        </div>
      </div>

      {Object.keys(chartsByExercise).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(chartsByExercise).map(([exerciseId, data]) => (
            <div key={exerciseId} className="bg-gray-800 p-4 rounded-lg space-y-6">
              <h3 className="text-lg font-semibold text-white">{exerciseNameById[exerciseId] || 'Exercise'}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} labelStyle={{ color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="maxWeight" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} name={`Max Weight (${unit})`} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} labelStyle={{ color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="totalVolume" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name={`Volume (${unit})`} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No progress data available in the selected date range.</div>
      )}
    </div>
  );
};
