import { Difficulty } from '../types';

export const DifficultyLabels: Record<Difficulty, string> = { 
  [Difficulty.LOW]: 'Baja',
  [Difficulty.MEDIUM]: 'Media',
  [Difficulty.HIGH]: 'Alta',
};

export const DifficultyOptions = Object.entries(DifficultyLabels).map(([value, label]) => ({
  value: value as Difficulty,
  label
}));