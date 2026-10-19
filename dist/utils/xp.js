"use strict";
/**
 * Mee6 XP formula calculation helpers.
 * Level n -> n+1 requires 5n^2 + 50n + 100 XP.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpForNextLevel = xpForNextLevel;
exports.totalXpForLevel = totalXpForLevel;
exports.levelFromXp = levelFromXp;
exports.xpProgress = xpProgress;
function xpForNextLevel(currentLevel) {
    const lvl = Math.max(0, currentLevel);
    return 5 * lvl * lvl + 50 * lvl + 100;
}
function totalXpForLevel(targetLevel) {
    let total = 0;
    for (let n = 0; n < targetLevel; n++) {
        total += 5 * n * n + 50 * n + 100;
    }
    return total;
}
function levelFromXp(totalXp) {
    let lvl = 0;
    let needed = 100;
    let remaining = Math.max(0, totalXp);
    while (remaining >= needed && lvl < 1000) {
        remaining -= needed;
        lvl++;
        needed = 5 * lvl * lvl + 50 * lvl + 100;
    }
    return lvl;
}
function xpProgress(totalXp) {
    const level = levelFromXp(totalXp);
    const xpAtCurrentLvl = totalXpForLevel(level);
    const currentXpInLevel = totalXp - xpAtCurrentLvl;
    const neededXpForLevel = xpForNextLevel(level);
    const progressPercent = Math.min(100, Math.max(0, Math.floor((currentXpInLevel / neededXpForLevel) * 100)));
    return {
        level,
        currentXpInLevel,
        neededXpForLevel,
        progressPercent,
    };
}
//# sourceMappingURL=xp.js.map