import { Goal } from '../types/goals';

describe('Minimal Test', () => {
  test('should import Goal enum correctly', () => {
    expect(Goal.RELIABILITY).toBe('reliability');
    expect(Goal.COST).toBe('cost');
    expect(Goal.SIMPLICITY).toBe('simplicity');
  });

  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
});