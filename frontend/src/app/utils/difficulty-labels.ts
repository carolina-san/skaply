import { Difficulty } from '../types';

/**
 * A mapping between each Difficulty value and its Spanish label.
 *
 * Example output:
 * {
 *   low: 'Baja',
 *   medium: 'Media',
 *   high: 'Alta'
 * }
 */
export const DifficultyLabels: Record<Difficulty, string> = { 
  [Difficulty.LOW]: 'Baja',
  [Difficulty.MEDIUM]: 'Media',
  [Difficulty.HIGH]: 'Alta',
};

/**
 * An array of `{ value, label }` pairs derived from `DifficultyLabels` (Spanish labels).
 * 
 * Useful for building dropdowns, form selectors, or filters.
 *
 * Example output:
 * [
 *   { value: 'low', label: 'Baja' },
 *   { value: 'medium', label: 'Media' },
 *   { value: 'high', label: 'Alta' }
 * ]
 */
export const DifficultyOptions = Object.entries(DifficultyLabels).map(([value, label]) => ({
  value: value as Difficulty,
  label
}));