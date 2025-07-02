import { attendanceService } from './attendanceService';
import { workerService } from './workerService';
import { siteService } from './siteService';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const reportService = {
  // Generate payroll report
  async generatePayrollReport(startDate, endDate) {
    try {
      // Get all attendance records
      const records = await attendanceService.getAttendanceRecords({
        startDate,
        endDate
      });

      // Get all workers
      const workers = await workerService.getWorkers();
      const workerMap = {};
      workers.forEach(w => workerMap[w.email] = w);

      // Group by worker
      const payrollData = {};
      
      records.forEach(record => {
        const email = record.userEmail;
        if (!payrollData[email]) {
          const worker = workerMap[email] || {};
          payrollData[email] = {
            name: worker.name || 'Unknown',
            email: email,
            payRate: worker.payRate || 0,
            totalHours: 0,
            totalEarnings: 0,
            daysWorked: new Set(),
            records: []
          };
        }
        
        payrollData[email].totalHours += record.totalHours || 0;
        payrollData[email].totalEarnings += record.payAmount || 0;
        payrollData[email].daysWorked.add(format(record.clockInTime, 'yyyy-MM-dd'));
        payrollData[email].records.push(record);
      });

      // Convert to array
      const payrollArray = Object.values(payrollData).map(worker => ({
        ...worker,
        daysWorked: worker.daysWorked.size,
        avgHoursPerDay: worker.daysWorked.size > 0 
          ? (worker.totalHours / worker.daysWorked.size).toFixed(2)
          : 0
      }));

      return payrollArray.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error generating payroll report:', error);
      throw error;
    }
  },

  // Generate attendance summary report
  async generateAttendanceSummary(startDate, endDate) {
    try {
      const records = await attendanceService.getAttendanceRecords({
        startDate,
        endDate
      });

      const summary = {
        totalRecords: records.length,
        totalHours: 0,
        totalEarnings: 0,
        uniqueWorkers: new Set(),
        dailyStats: {},
        siteStats: {}
      };

      records.forEach(record => {
        summary.totalHours += record.totalHours || 0;
        summary.totalEarnings += record.payAmount || 0;
        summary.uniqueWorkers.add(record.userEmail);

        // Daily stats
        const date = format(record.clockInTime, 'yyyy-MM-dd');
        if (!summary.dailyStats[date]) {
          summary.dailyStats[date] = {
            workers: new Set(),
            hours: 0,
            earnings: 0
          };
        }
        summary.dailyStats[date].workers.add(record.userEmail);
        summary.dailyStats[date].hours += record.totalHours || 0;
        summary.dailyStats[date].earnings += record.payAmount || 0;

        // Site stats
        const siteId = record.siteId || 'unassigned';
        if (!summary.siteStats[siteId]) {
          summary.siteStats[siteId] = {
            workers: new Set(),
            hours: 0,
            records: 0
          };
        }
        summary.siteStats[siteId].workers.add(record.userEmail);
        summary.siteStats[siteId].hours += record.totalHours || 0;
        summary.siteStats[siteId].records += 1;
      });

      // Convert sets to counts
      summary.uniqueWorkers = summary.uniqueWorkers.size;
      Object.keys(summary.dailyStats).forEach(date => {
        summary.dailyStats[date].workerCount = summary.dailyStats[date].workers.size;
        delete summary.dailyStats[date].workers;
      });
      Object.keys(summary.siteStats).forEach(siteId => {
        summary.siteStats[siteId].workerCount = summary.siteStats[siteId].workers.size;
        delete summary.siteStats[siteId].workers;
      });

      return summary;
    } catch (error) {
      console.error('Error generating attendance summary:', error);
      throw error;
    }
  },

  // Export to PDF
  async exportToPDF(reportType, data, startDate, endDate) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text('GeoAttendance Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${reportType} Report`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 
      pageWidth / 2, 37, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 44, { align: 'center' });

    if (reportType === 'Payroll') {
      // Payroll table
      const tableData = data.map(worker => [
        worker.name,
        worker.email,
        `$${worker.payRate.toFixed(2)}`,
        worker.daysWorked,
        worker.totalHours.toFixed(2),
        `$${worker.totalEarnings.toFixed(2)}`
      ]);

      doc.autoTable({
        head: [['Name', 'Email', 'Rate/hr', 'Days', 'Hours', 'Total Pay']],
        body: tableData,
        startY: 55,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] }
      });

      // Summary
      const totalEarnings = data.reduce((sum, w) => sum + w.totalEarnings, 0);
      const totalHours = data.reduce((sum, w) => sum + w.totalHours, 0);
      
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 14, finalY);
      doc.text(`Total Payroll: $${totalEarnings.toFixed(2)}`, 14, finalY + 7);
    }

    // Save
    doc.save(`${reportType.toLowerCase()}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  // Export to Excel
  async exportToExcel(reportType, data, startDate, endDate) {
    const wb = XLSX.utils.book_new();
    
    if (reportType === 'Payroll') {
      // Create payroll sheet
      const wsData = [
        ['Payroll Report'],
        [`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
        [],
        ['Name', 'Email', 'Pay Rate', 'Days Worked', 'Total Hours', 'Total Earnings']
      ];

      data.forEach(worker => {
        wsData.push([
          worker.name,
          worker.email,
          worker.payRate,
          worker.daysWorked,
          worker.totalHours,
          worker.totalEarnings
        ]);
      });

      // Add totals
      wsData.push([]);
      wsData.push([
        'TOTAL',
        '',
        '',
        '',
        data.reduce((sum, w) => sum + w.totalHours, 0),
        data.reduce((sum, w) => sum + w.totalEarnings, 0)
      ]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [
        { width: 20 }, // Name
        { width: 25 }, // Email
        { width: 10 }, // Pay Rate
        { width: 12 }, // Days
        { width: 12 }, // Hours
        { width: 15 }  // Earnings
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    }

    // Save file
    XLSX.writeFile(wb, `${reportType.toLowerCase()}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }
};