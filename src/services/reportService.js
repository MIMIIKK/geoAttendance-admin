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
      console.log('Generating payroll report for:', startDate, 'to', endDate);
      
      // Get all attendance records for the date range
      const records = await attendanceService.getAttendanceRecords({
        startDate,
        endDate
      });

      console.log('Found attendance records:', records.length);

      // Get all workers
      const workers = await workerService.getWorkers();
      const workerMap = {};
      workers.forEach(w => workerMap[w.email] = w);

      // Group by worker
      const payrollData = {};
      
      records.forEach(record => {
        if (!record.clockInTime) return; // Skip invalid records
        
        const email = record.userEmail;
        if (!payrollData[email]) {
          const worker = workerMap[email] || {};
          payrollData[email] = {
            name: worker.name || 'Unknown Worker',
            email: email,
            payRate: worker.payRate || 0,
            totalHours: 0,
            totalEarnings: 0,
            daysWorked: new Set(),
            records: []
          };
        }
        
        const hours = record.totalHours || 0;
        const earnings = record.payAmount || (hours * payrollData[email].payRate);
        
        payrollData[email].totalHours += hours;
        payrollData[email].totalEarnings += earnings;
        
        if (record.clockInTime) {
          payrollData[email].daysWorked.add(format(new Date(record.clockInTime), 'yyyy-MM-dd'));
        }
        
        payrollData[email].records.push(record);
      });

      // Convert to array and calculate averages
      const payrollArray = Object.values(payrollData).map(worker => ({
        ...worker,
        daysWorked: worker.daysWorked.size,
        avgHoursPerDay: worker.daysWorked.size > 0 
          ? (worker.totalHours / worker.daysWorked.size).toFixed(2)
          : '0.00'
      }));

      console.log('Payroll data processed:', payrollArray.length, 'workers');
      return payrollArray.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error generating payroll report:', error);
      throw error;
    }
  },

  // Generate attendance summary report
  async generateAttendanceSummary(startDate, endDate) {
    try {
      console.log('Generating attendance summary for:', startDate, 'to', endDate);
      
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
        if (!record.clockInTime) return;
        
        const hours = record.totalHours || 0;
        const earnings = record.payAmount || 0;
        
        summary.totalHours += hours;
        summary.totalEarnings += earnings;
        summary.uniqueWorkers.add(record.userEmail);

        // Daily stats
        const date = format(new Date(record.clockInTime), 'yyyy-MM-dd');
        if (!summary.dailyStats[date]) {
          summary.dailyStats[date] = {
            workers: new Set(),
            hours: 0,
            earnings: 0,
            records: 0
          };
        }
        summary.dailyStats[date].workers.add(record.userEmail);
        summary.dailyStats[date].hours += hours;
        summary.dailyStats[date].earnings += earnings;
        summary.dailyStats[date].records += 1;

        // Site stats
        const siteName = record.siteName || record.siteId || 'Unassigned';
        if (!summary.siteStats[siteName]) {
          summary.siteStats[siteName] = {
            workers: new Set(),
            hours: 0,
            earnings: 0,
            records: 0
          };
        }
        summary.siteStats[siteName].workers.add(record.userEmail);
        summary.siteStats[siteName].hours += hours;
        summary.siteStats[siteName].earnings += earnings;
        summary.siteStats[siteName].records += 1;
      });

      // Convert sets to counts
      summary.uniqueWorkers = summary.uniqueWorkers.size;
      
      Object.keys(summary.dailyStats).forEach(date => {
        summary.dailyStats[date].workerCount = summary.dailyStats[date].workers.size;
        delete summary.dailyStats[date].workers;
      });
      
      Object.keys(summary.siteStats).forEach(siteName => {
        summary.siteStats[siteName].workerCount = summary.siteStats[siteName].workers.size;
        delete summary.siteStats[siteName].workers;
      });

      console.log('Attendance summary generated:', summary);
      return summary;
    } catch (error) {
      console.error('Error generating attendance summary:', error);
      throw error;
    }
  },

  // Generate site analysis report
  async generateSiteAnalysis(startDate, endDate) {
    try {
      console.log('Generating site analysis for:', startDate, 'to', endDate);
      
      const records = await attendanceService.getAttendanceRecords({
        startDate,
        endDate
      });

      const sites = await siteService.getSites();
      const siteMap = {};
      sites.forEach(s => siteMap[s.siteId] = s);

      const siteAnalysis = {};

      records.forEach(record => {
        if (!record.clockInTime) return;
        
        const siteName = record.siteName || record.siteId || 'Unassigned';
        const siteId = record.siteId || 'unassigned';
        
        if (!siteAnalysis[siteName]) {
          const siteInfo = siteMap[siteId] || {};
          siteAnalysis[siteName] = {
            siteName,
            siteId,
            address: siteInfo.address || 'Unknown',
            totalWorkers: new Set(),
            totalHours: 0,
            totalEarnings: 0,
            totalRecords: 0,
            averageHoursPerDay: 0,
            peakDays: {},
            workerList: []
          };
        }

        const hours = record.totalHours || 0;
        const earnings = record.payAmount || 0;
        
        siteAnalysis[siteName].totalWorkers.add(record.userEmail);
        siteAnalysis[siteName].totalHours += hours;
        siteAnalysis[siteName].totalEarnings += earnings;
        siteAnalysis[siteName].totalRecords += 1;

        // Track peak days
        const date = format(new Date(record.clockInTime), 'yyyy-MM-dd');
        if (!siteAnalysis[siteName].peakDays[date]) {
          siteAnalysis[siteName].peakDays[date] = {
            workers: new Set(),
            hours: 0
          };
        }
        siteAnalysis[siteName].peakDays[date].workers.add(record.userEmail);
        siteAnalysis[siteName].peakDays[date].hours += hours;
      });

      // Process final calculations
      const siteArray = Object.values(siteAnalysis).map(site => {
        const uniqueDays = Object.keys(site.peakDays).length;
        const workerCount = site.totalWorkers.size;
        
        // Find peak day
        let peakDay = { date: 'N/A', workers: 0, hours: 0 };
        Object.entries(site.peakDays).forEach(([date, data]) => {
          const workers = data.workers.size;
          if (workers > peakDay.workers) {
            peakDay = {
              date: format(new Date(date), 'MMM dd'),
              workers,
              hours: data.hours
            };
          }
        });

        return {
          ...site,
          totalWorkers: workerCount,
          averageHoursPerDay: uniqueDays > 0 ? (site.totalHours / uniqueDays).toFixed(2) : '0.00',
          averageWorkersPerDay: uniqueDays > 0 ? (workerCount / uniqueDays).toFixed(1) : '0.0',
          peakDay,
          utilization: site.totalHours > 0 ? ((site.totalHours / (workerCount * uniqueDays * 8)) * 100).toFixed(1) : '0.0'
        };
      });

      console.log('Site analysis generated:', siteArray.length, 'sites');
      return siteArray.sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('Error generating site analysis:', error);
      throw error;
    }
  },

  // Generate worker performance report
  async generateWorkerPerformance(startDate, endDate) {
    try {
      console.log('Generating worker performance for:', startDate, 'to', endDate);
      
      const records = await attendanceService.getAttendanceRecords({
        startDate,
        endDate
      });

      const workers = await workerService.getWorkers();
      const workerMap = {};
      workers.forEach(w => workerMap[w.email] = w);

      const performance = {};

      records.forEach(record => {
        if (!record.clockInTime) return;
        
        const email = record.userEmail;
        if (!performance[email]) {
          const worker = workerMap[email] || {};
          performance[email] = {
            name: worker.name || 'Unknown Worker',
            email,
            siteName: worker.siteName || 'Unassigned',
            payRate: worker.payRate || 0,
            totalHours: 0,
            totalEarnings: 0,
            daysWorked: new Set(),
            onTimeRecords: 0,
            lateRecords: 0,
            productivity: 0,
            averageHoursPerDay: 0,
            lastWorked: null
          };
        }

        const hours = record.totalHours || 0;
        const earnings = record.payAmount || 0;
        
        performance[email].totalHours += hours;
        performance[email].totalEarnings += earnings;
        performance[email].daysWorked.add(format(new Date(record.clockInTime), 'yyyy-MM-dd'));

        // Check if on time (assuming 9 AM start time)
        const clockInHour = new Date(record.clockInTime).getHours();
        if (clockInHour <= 9) {
          performance[email].onTimeRecords += 1;
        } else {
          performance[email].lateRecords += 1;
        }

        // Track last worked date
        const workDate = new Date(record.clockInTime);
        if (!performance[email].lastWorked || workDate > performance[email].lastWorked) {
          performance[email].lastWorked = workDate;
        }
      });

      // Calculate final metrics
      const performanceArray = Object.values(performance).map(worker => {
        const daysWorked = worker.daysWorked.size;
        const totalRecords = worker.onTimeRecords + worker.lateRecords;
        
        return {
          ...worker,
          daysWorked,
          averageHoursPerDay: daysWorked > 0 ? (worker.totalHours / daysWorked).toFixed(2) : '0.00',
          punctualityRate: totalRecords > 0 ? ((worker.onTimeRecords / totalRecords) * 100).toFixed(1) : '0.0',
          productivity: worker.totalHours > 0 ? ((worker.totalHours / (daysWorked * 8)) * 100).toFixed(1) : '0.0',
          lastWorked: worker.lastWorked ? format(worker.lastWorked, 'MMM dd, yyyy') : 'Never',
          efficiency: worker.payRate > 0 ? (worker.totalEarnings / (worker.totalHours * worker.payRate) * 100).toFixed(1) : '0.0'
        };
      });

      console.log('Worker performance generated:', performanceArray.length, 'workers');
      return performanceArray.sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('Error generating worker performance:', error);
      throw error;
    }
  },

  // Export to PDF
  async exportToPDF(reportType, data, startDate, endDate) {
    try {
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

      let startY = 55;

      if (reportType === 'Payroll') {
        const tableData = data.map(worker => [
          worker.name,
          worker.email,
          `${worker.payRate.toFixed(2)}`,
          worker.daysWorked.toString(),
          worker.totalHours.toFixed(2),
          `${worker.totalEarnings.toFixed(2)}`
        ]);

        doc.autoTable({
          head: [['Name', 'Email', 'Rate/hr', 'Days', 'Hours', 'Total Pay']],
          body: tableData,
          startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 150, 243] }
        });

        const totalEarnings = data.reduce((sum, w) => sum + w.totalEarnings, 0);
        const totalHours = data.reduce((sum, w) => sum + w.totalHours, 0);
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 14, finalY);
        doc.text(`Total Payroll: ${totalEarnings.toFixed(2)}`, 14, finalY + 7);
        doc.text(`Average per Worker: ${(totalEarnings / data.length).toFixed(2)}`, 14, finalY + 14);
      } 
      else if (reportType === 'Attendance Summary') {
        // Summary stats
        doc.setFontSize(12);
        doc.text('Summary Statistics:', 14, startY);
        startY += 10;
        
        doc.setFontSize(10);
        doc.text(`Total Records: ${data.totalRecords}`, 14, startY);
        doc.text(`Unique Workers: ${data.uniqueWorkers}`, 14, startY + 7);
        doc.text(`Total Hours: ${data.totalHours.toFixed(2)}`, 14, startY + 14);
        doc.text(`Total Earnings: ${data.totalEarnings.toFixed(2)}`, 14, startY + 21);
        
        startY += 35;

        // Daily breakdown
        if (data.dailyStats && Object.keys(data.dailyStats).length > 0) {
          doc.setFontSize(12);
          doc.text('Daily Breakdown:', 14, startY);
          startY += 10;

          const dailyData = Object.entries(data.dailyStats).map(([date, stats]) => [
            format(new Date(date), 'MMM dd, yyyy'),
            stats.workerCount.toString(),
            stats.hours.toFixed(2),
            stats.records.toString(),
            `${stats.earnings.toFixed(2)}`
          ]);

          doc.autoTable({
            head: [['Date', 'Workers', 'Hours', 'Records', 'Earnings']],
            body: dailyData,
            startY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [33, 150, 243] }
          });

          startY = doc.lastAutoTable.finalY + 15;
        }

        // Site breakdown
        if (data.siteStats && Object.keys(data.siteStats).length > 0) {
          doc.setFontSize(12);
          doc.text('Site Breakdown:', 14, startY);
          startY += 10;

          const siteData = Object.entries(data.siteStats).map(([siteName, stats]) => [
            siteName,
            stats.workerCount.toString(),
            stats.hours.toFixed(2),
            stats.records.toString(),
            `${stats.earnings.toFixed(2)}`
          ]);

          doc.autoTable({
            head: [['Site Name', 'Workers', 'Hours', 'Records', 'Earnings']],
            body: siteData,
            startY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [33, 150, 243] }
          });
        }
      }
      else if (reportType === 'Site Analysis') {
        const tableData = data.map(site => [
          site.siteName,
          site.totalWorkers.toString(),
          site.totalHours.toFixed(2),
          `${site.totalEarnings.toFixed(2)}`,
          site.averageHoursPerDay,
          `${site.utilization}%`
        ]);

        doc.autoTable({
          head: [['Site Name', 'Workers', 'Total Hours', 'Earnings', 'Avg Hours/Day', 'Utilization']],
          body: tableData,
          startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 150, 243] }
        });
      }
      else if (reportType === 'Worker Performance') {
        const tableData = data.map(worker => [
          worker.name,
          worker.daysWorked.toString(),
          worker.totalHours.toFixed(2),
          worker.averageHoursPerDay,
          `${worker.punctualityRate}%`,
          `${worker.productivity}%`
        ]);

        doc.autoTable({
          head: [['Name', 'Days', 'Hours', 'Avg/Day', 'Punctuality', 'Productivity']],
          body: tableData,
          startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 150, 243] }
        });
      }

      // Save
      doc.save(`${reportType.toLowerCase().replace(' ', '-')}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  },

  // Export to Excel
  async exportToExcel(reportType, data, startDate, endDate) {
    try {
      const wb = XLSX.utils.book_new();
      
      if (reportType === 'Payroll') {
        const wsData = [
          ['Payroll Report'],
          [`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
          [`Generated: ${format(new Date(), 'PPpp')}`],
          [],
          ['Name', 'Email', 'Pay Rate', 'Days Worked', 'Total Hours', 'Avg Hours/Day', 'Total Earnings']
        ];

        data.forEach(worker => {
          wsData.push([
            worker.name,
            worker.email,
            worker.payRate,
            worker.daysWorked,
            worker.totalHours,
            worker.avgHoursPerDay,
            worker.totalEarnings
          ]);
        });

        wsData.push([]);
        wsData.push([
          'TOTALS',
          '',
          '',
          data.length,
          data.reduce((sum, w) => sum + w.totalHours, 0),
          '',
          data.reduce((sum, w) => sum + w.totalEarnings, 0)
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { width: 20 }, { width: 25 }, { width: 12 }, 
          { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
      }
      else if (reportType === 'Attendance Summary') {
        // Summary Sheet
        const summaryData = [
          ['Attendance Summary Report'],
          [`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
          [`Generated: ${format(new Date(), 'PPpp')}`],
          [],
          ['Summary Statistics'],
          ['Total Records', data.totalRecords],
          ['Unique Workers', data.uniqueWorkers],
          ['Total Hours', data.totalHours],
          ['Total Earnings', data.totalEarnings],
          []
        ];

        // Daily breakdown
        if (data.dailyStats && Object.keys(data.dailyStats).length > 0) {
          summaryData.push(['Daily Breakdown']);
          summaryData.push(['Date', 'Workers', 'Hours', 'Records', 'Earnings']);
          
          Object.entries(data.dailyStats)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .forEach(([date, stats]) => {
              summaryData.push([
                format(new Date(date), 'MMM dd, yyyy'),
                stats.workerCount,
                stats.hours,
                stats.records,
                stats.earnings
              ]);
            });
          
          summaryData.push([]);
        }

        // Site breakdown
        if (data.siteStats && Object.keys(data.siteStats).length > 0) {
          summaryData.push(['Site Breakdown']);
          summaryData.push(['Site Name', 'Workers', 'Hours', 'Records', 'Earnings']);
          
          Object.entries(data.siteStats)
            .sort(([,a], [,b]) => b.hours - a.hours)
            .forEach(([siteName, stats]) => {
              summaryData.push([
                siteName,
                stats.workerCount,
                stats.hours,
                stats.records,
                stats.earnings
              ]);
            });
        }

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        ws['!cols'] = [
          { width: 20 }, { width: 15 }, { width: 15 }, 
          { width: 15 }, { width: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      }
      else if (reportType === 'Site Analysis') {
        const wsData = [
          ['Site Analysis Report'],
          [`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
          [`Generated: ${format(new Date(), 'PPpp')}`],
          [],
          ['Site Name', 'Address', 'Total Workers', 'Total Hours', 'Total Earnings', 'Avg Hours/Day', 'Utilization %']
        ];

        data.forEach(site => {
          wsData.push([
            site.siteName,
            site.address,
            site.totalWorkers,
            site.totalHours,
            site.totalEarnings,
            site.averageHoursPerDay,
            site.utilization
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { width: 20 }, { width: 30 }, { width: 15 }, 
          { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Site Analysis');
      }
      else if (reportType === 'Worker Performance') {
        const wsData = [
          ['Worker Performance Report'],
          [`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
          [`Generated: ${format(new Date(), 'PPpp')}`],
          [],
          ['Name', 'Email', 'Site', 'Days Worked', 'Total Hours', 'Avg Hours/Day', 'Punctuality %', 'Productivity %', 'Last Worked']
        ];

        data.forEach(worker => {
          wsData.push([
            worker.name,
            worker.email,
            worker.siteName,
            worker.daysWorked,
            worker.totalHours,
            worker.averageHoursPerDay,
            worker.punctualityRate,
            worker.productivity,
            worker.lastWorked
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { width: 20 }, { width: 25 }, { width: 20 }, 
          { width: 12 }, { width: 12 }, { width: 15 }, 
          { width: 15 }, { width: 15 }, { width: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Performance');
      }

      // Save file
      XLSX.writeFile(wb, `${reportType.toLowerCase().replace(' ', '-')}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error;
    }
  }
};