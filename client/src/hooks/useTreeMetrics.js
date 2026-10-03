import { useMemo } from 'react';

/**
 * Hook for calculating botanical growth metrics, sequential deltas, and vitality formatting
 */
export function useTreeMetrics(tree, logs = []) {
  return useMemo(() => {
    if (!tree) {
      return {
        baselineHeight: null,
        latestHeight: null,
        totalHeightGain: 0,
        latestStemDiameter: null,
        latestLeafCount: null,
        latestLogDate: null,
        daysPlanted: 0,
        observationCount: 0,
        vitalityTier: 'Thriving',
        vitalityColor: 'emerald',
      };
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
    const observationCount = sortedLogs.length;

    const baselineHeight = sortedLogs.length > 0 ? sortedLogs[0].height : null;
    const latestLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;

    const latestHeight = latestLog ? latestLog.height : null;
    const totalHeightGain = (latestHeight !== null && baselineHeight !== null)
      ? Math.round((latestHeight - baselineHeight) * 10) / 10
      : 0;

    const latestStemDiameter = latestLog ? latestLog.stemDiameter : null;
    const latestLeafCount = latestLog ? latestLog.leafCount : null;
    const latestLogDate = latestLog ? latestLog.loggedAt : null;

    // Calculate days elapsed since planting
    const plantDate = tree.datePlanted ? new Date(tree.datePlanted) : new Date(tree.createdAt || Date.now());
    const daysPlanted = Math.max(0, Math.floor((Date.now() - plantDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Vitality classification color tokens
    const vitality = tree.healthStatus || 'Thriving';
    let vitalityColor = 'emerald';
    if (vitality.includes('Stable') || vitality.includes('Fair') || vitality === 'Monitoring') {
      vitalityColor = 'amber';
    } else if (vitality.includes('Distressed') || vitality.includes('Risk') || vitality === 'Needs Attention') {
      vitalityColor = 'orange';
    } else if (vitality.includes('Dead') || vitality.includes('Mortality') || tree.status === 'dead') {
      vitalityColor = 'zinc';
    }

    return {
      baselineHeight,
      latestHeight,
      totalHeightGain,
      latestStemDiameter,
      latestLeafCount,
      latestLogDate,
      daysPlanted,
      observationCount,
      vitalityTier: vitality,
      vitalityColor,
      latestLog,
    };
  }, [tree, logs]);
}
