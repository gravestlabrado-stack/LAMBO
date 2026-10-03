import * as XLSX from 'xlsx';
import { formatDate } from '../../utils/formatters';

/**
 * Export entire cadet cohort compliance roster to formatted Excel spreadsheet
 * @param {Array} roster - Array of cadet roster objects
 */
export function exportCohortToExcel(roster = []) {
  if (!roster || roster.length === 0) return;

  const rows = roster.map((cadet) => {
    let standing = 'Satisfactory';
    if (cadet.complianceStatus === 'Overdue') standing = 'Pending Observation';
    if (cadet.complianceStatus === 'Delinquent') standing = 'Action Required';
    if (cadet.complianceStatus === 'Unassigned') standing = 'No Specimen Assigned';

    return {
      'Cadet Name': cadet.name,
      'Student / Roll Number': cadet.rollNumber,
      'Academic Course / Program': cadet.course || 'N/A',
      'Role': cadet.role === 'officer' ? 'Officer' : 'Student Cadet',
      'Contact Phone': cadet.phone || 'N/A',
      'Assigned Specimens': cadet.totalTrees,
      'Surviving Specimens': cadet.aliveTrees,
      'Mortality Specimens': cadet.deadTrees,
      'Observations Recorded': cadet.totalLogs,
      'Last Observation Date': cadet.lastLogDate
        ? formatDate(cadet.lastLogDate, true)
        : 'None',
      'Days Since Observation':
        cadet.daysSinceLastLog !== null ? cadet.daysSinceLastLog : 'N/A',
      'Compliance Status': cadet.complianceStatus,
      'NSTP Standing': standing,
      'Enrolled At': formatDate(cadet.enrolledAt, true),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Formatting column widths
  worksheet['!cols'] = [
    { wch: 24 }, // Cadet Name
    { wch: 20 }, // Roll Number
    { wch: 28 }, // Course
    { wch: 14 }, // Role
    { wch: 18 }, // Phone
    { wch: 18 }, // Assigned
    { wch: 18 }, // Alive
    { wch: 18 }, // Dead
    { wch: 20 }, // Total Logs
    { wch: 22 }, // Last Date
    { wch: 22 }, // Days
    { wch: 18 }, // Compliance
    { wch: 22 }, // Standing
    { wch: 20 }, // Enrolled
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cadet Compliance');

  const fileName = `LAMBO_NSTP_Roster_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
