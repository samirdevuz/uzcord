import { describe, expect, it } from 'vitest';
import { levelFromXp, totalXpForLevel, xpForNextLevel, xpProgress } from '../src/utils/xp';

describe('XP and Level calculations', () => {
  it('calculates correct XP for next level', () => {
    expect(xpForNextLevel(0)).toBe(100);
    expect(xpForNextLevel(1)).toBe(155);
    expect(xpForNextLevel(2)).toBe(220);
  });

  it('calculates total accumulated XP for target level', () => {
    expect(totalXpForLevel(0)).toBe(0);
    expect(totalXpForLevel(1)).toBe(100);
    expect(totalXpForLevel(2)).toBe(255); // 100 + 155
  });

  it('calculates correct level from total XP', () => {
    expect(levelFromXp(0)).toBe(0);
    expect(levelFromXp(99)).toBe(0);
    expect(levelFromXp(100)).toBe(1);
    expect(levelFromXp(254)).toBe(1);
    expect(levelFromXp(255)).toBe(2);
  });

  it('calculates progress percentage correctly', () => {
    const prog0 = xpProgress(0);
    expect(prog0.level).toBe(0);
    expect(prog0.currentXpInLevel).toBe(0);
    expect(prog0.neededXpForLevel).toBe(100);
    expect(prog0.progressPercent).toBe(0);

    const prog50 = xpProgress(50);
    expect(prog50.level).toBe(0);
    expect(prog50.currentXpInLevel).toBe(50);
    expect(prog50.progressPercent).toBe(50);

    const progLvl1 = xpProgress(100);
    expect(progLvl1.level).toBe(1);
    expect(progLvl1.currentXpInLevel).toBe(0);
  });
});
