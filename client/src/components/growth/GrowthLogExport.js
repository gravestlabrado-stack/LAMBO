import * as XLSX from 'xlsx';
import { formatDate } from '../../utils/formatters';

/**
 * Pure utility function to export growth observation ledger to Excel (.xlsx)
 */
export const exportGrowthLogsToExcel = (logs, activeTree, selectedTreeId) => {
  if (!logs || logs.length === 0) return false;

  const dataToExport = logs.map((log) => {
    const auditor = log.loggedBy;
    const auditorName =
      typeof auditor === 'object' && auditor?.name
        ? `${auditor.name} (${auditor.rollNumber || 'Student'})`
        : 'Student Ranger';

    const treeObj =
      typeof log.tree === 'object' ? log.tree : activeTree;

    return {
      'Specimen Tree ID': treeObj?.treeId || selectedTreeId,
      'Botanical Species': treeObj?.species || 'N/A',
      'Specimen Nickname': treeObj?.nickname || '',
      'Campus Location / Sector': treeObj?.location || 'CTU Barili Campus',
      'Observation Date': formatDate(log.loggedAt, true),
      'Timestamp': new Date(log.loggedAt).toISOString(),
      'Height (cm)': log.height,
      'Stem DBH (mm)': log.stemDiameter !== null && log.stemDiameter !== undefined ? log.stemDiameter : '',
      'Leaf Count': log.leafCount !== null && log.leafCount !== undefined ? log.leafCount : '',
      'Fruit / Pod Count': log.fruitCount !== null && log.fruitCount !== undefined ? log.fruitCount : '',
      'Growth Stage': log.growthStage || 'Vegetative',
      'Health Assessment': log.healthStatus || 'Healthy',
      'Auditor Name': auditorName,
      'Field Notes': log.notes || '',
      'Photo Evidence URL': log.photo || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Column width formatting
  worksheet['!cols'] = [
    { wch: 18 }, // Tree ID
    { wch: 25 }, // Species
    { wch: 18 }, // Nickname
    { wch: 25 }, // Location
    { wch: 18 }, // Observation Date
    { wch: 24 }, // Timestamp
    { wch: 12 }, // Height
    { wch: 14 }, // DBH
    { wch: 12 }, // Leaf Count
    { wch: 16 }, // Fruit Count
    { wch: 16 }, // Growth Stage
    { wch: 18 }, // Health Assessment
    { wch: 28 }, // Auditor Name
    { wch: 35 }, // Notes
    { wch: 40 }, // Photo URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Growth Telemetry');

  const fileName = `LAMBO_${selectedTreeId || 'Campus'}_Growth_Telemetry_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return true;
};
