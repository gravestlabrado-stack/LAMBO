import { useState, useMemo } from 'react';

/**
 * Hook for managing officer roster filters, course grouping, and cohort KPI statistics
 */
export function useOfficerCohort(initialRoster = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all'); // 'all' | 'active' | 'overdue' | 'delinquent' | 'officers'
  const [courseFilter, setCourseFilter] = useState('all');

  // Derive unique courses from roster
  const courses = useMemo(() => {
    const set = new Set();
    initialRoster.forEach((c) => {
      if (c.course && c.course !== 'Unspecified') {
        set.add(c.course);
      }
    });
    return Array.from(set).sort();
  }, [initialRoster]);

  // Cohort KPI summary statistics
  const stats = useMemo(() => {
    let totalCadets = 0;
    let totalOfficers = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let delinquentCount = 0;
    let totalTrees = 0;
    let aliveTrees = 0;
    let deadTrees = 0;

    initialRoster.forEach((cadet) => {
      if (cadet.role === 'officer') {
        totalOfficers++;
      } else {
        totalCadets++;
      }

      totalTrees += cadet.totalTrees || 0;
      aliveTrees += cadet.aliveTrees || 0;
      deadTrees += cadet.deadTrees || 0;

      if (cadet.complianceStatus === 'Active') activeCount++;
      else if (cadet.complianceStatus === 'Overdue') overdueCount++;
      else if (cadet.complianceStatus === 'Delinquent') delinquentCount++;
    });

    const cohortSurvivalRate = totalTrees > 0
      ? Math.round((aliveTrees / totalTrees) * 100)
      : 100;

    return {
      totalPersonnel: initialRoster.length,
      totalCadets,
      totalOfficers,
      activeCount,
      overdueCount,
      delinquentCount,
      totalTrees,
      aliveTrees,
      deadTrees,
      cohortSurvivalRate,
    };
  }, [initialRoster]);

  // Filtered roster based on search, compliance, and course
  const filteredRoster = useMemo(() => {
    return initialRoster.filter((cadet) => {
      // 1. Compliance filter
      if (complianceFilter === 'officers' && cadet.role !== 'officer') return false;
      if (complianceFilter === 'active' && cadet.complianceStatus !== 'Active') return false;
      if (complianceFilter === 'overdue' && cadet.complianceStatus !== 'Overdue') return false;
      if (complianceFilter === 'delinquent' && cadet.complianceStatus !== 'Delinquent') return false;

      // 2. Course filter
      if (courseFilter !== 'all' && cadet.course !== courseFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (cadet.name || '').toLowerCase().includes(query);
        const matchesRoll = (cadet.rollNumber || '').toLowerCase().includes(query);
        const matchesCourse = (cadet.course || '').toLowerCase().includes(query);
        const matchesTrees = (cadet.specimens || []).some(
          (t) =>
            (t.treeId || '').toLowerCase().includes(query) ||
            (t.species || '').toLowerCase().includes(query) ||
            (t.nickname || '').toLowerCase().includes(query)
        );

        return matchesName || matchesRoll || matchesCourse || matchesTrees;
      }

      return true;
    });
  }, [initialRoster, complianceFilter, courseFilter, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    complianceFilter,
    setComplianceFilter,
    courseFilter,
    setCourseFilter,
    courses,
    stats,
    filteredRoster,
  };
}
