import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  collectionGroup
} from 'firebase/firestore';
import { db } from './firebase';
import { workerService } from './workerService';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
  // Helper function to convert timestamps
  convertTimestamp(timestamp) {
    if (!timestamp) return null;
    
    if (typeof timestamp === 'number') {
      // Check if timestamp is in seconds or milliseconds
      if (timestamp > 9999999999) {
        return new Date(timestamp);
      } else {
        return new Date(timestamp * 1000);
      }
    } else if (timestamp.toDate) {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    }
    return null;
  },

  // Get all worker emails from the workers collection
  async getAllWorkerEmails() {
    try {
      const workers = await workerService.getWorkers();
      return workers
        .map(worker => worker.email)
        .filter(email => email && email.includes('@'));
    } catch (error) {
      console.error('Error getting worker emails:', error);
      return [];
    }
  },

  // Get attendance records for a date range
  async getAttendanceRecords(filters = {}) {
    try {
      const { startDate, endDate, userEmail, siteId } = filters;
      const records = [];

      if (userEmail && userEmail !== '' && userEmail !== 'all') {
        // Get specific user's attendance
        const userAttendanceRef = collection(db, COLLECTION_NAME, userEmail, 'records');
        const snapshot = await getDocs(userAttendanceRef);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const record = {
            id: doc.id,
            userEmail,
            ...data,
            clockInTime: this.convertTimestamp(data.clockInTime),
            clockOutTime: this.convertTimestamp(data.clockOutTime)
          };
          records.push(record);
        });
      } else {
        // Get all workers' attendance
        const workerEmails = await this.getAllWorkerEmails();
        
        for (const email of workerEmails) {
          try {
            const userAttendanceRef = collection(db, COLLECTION_NAME, email, 'records');
            const snapshot = await getDocs(userAttendanceRef);
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              const record = {
                id: doc.id,
                userEmail: email,
                ...data,
                clockInTime: this.convertTimestamp(data.clockInTime),
                clockOutTime: this.convertTimestamp(data.clockOutTime)
              };
              records.push(record);
            });
          } catch (error) {
            // Silently continue if a worker has no attendance records
            continue;
          }
        }
      }

      // Apply filters
      let filteredRecords = records;

      // Date filtering
      if (startDate || endDate) {
        filteredRecords = records.filter(record => {
          if (!record.clockInTime) return false;

          const recordDate = new Date(record.clockInTime);
          let passesFilter = true;

          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const recordDateOnly = new Date(recordDate);
            recordDateOnly.setHours(0, 0, 0, 0);
            
            passesFilter = passesFilter && recordDateOnly >= start;
          }

          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            passesFilter = passesFilter && recordDate <= end;
          }

          return passesFilter;
        });
      }

      // Site filtering
      if (siteId && siteId !== '') {
        filteredRecords = filteredRecords.filter(record => 
          record.siteId === siteId || record.siteName === siteId
        );
      }

      // Sort by clockInTime descending
      filteredRecords.sort((a, b) => {
        if (!a.clockInTime) return 1;
        if (!b.clockInTime) return -1;
        return b.clockInTime - a.clockInTime;
      });

      return filteredRecords;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Get today's attendance for all users
  async getTodayAttendance() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const records = await this.getAttendanceRecords({
        startDate: today,
        endDate: today
      });

      return records;
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  },

  // Subscribe to real-time attendance updates
  subscribeToLiveAttendance(callback) {
    try {
      // Use polling for live updates (since collectionGroup requires indexes)
      const pollInterval = setInterval(async () => {
        try {
          const records = await this.getTodayAttendance();
          const activeRecords = records.filter(record => !record.clockOutTime);
          callback(activeRecords);
        } catch (error) {
          console.error('Error in live tracking:', error);
        }
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error setting up live attendance subscription:', error);
      return () => {};
    }
  },

  // Create manual attendance record
  async createManualAttendance(attendanceData) {
    try {
      const { userEmail, ...data } = attendanceData;
      const recordId = `manual_${Date.now()}`;
      
      const record = {
        ...data,
        recordId,
        isManual: true,
        createdAt: Timestamp.now(),
        clockInTime: Timestamp.fromDate(new Date(data.clockInTime)),
        clockOutTime: data.clockOutTime ? Timestamp.fromDate(new Date(data.clockOutTime)) : null,
        userEmail
      };

      // Calculate total hours and pay amount if clockOutTime exists
      if (record.clockOutTime) {
        const timeDiff = record.clockOutTime.toDate() - record.clockInTime.toDate();
        const hours = timeDiff / (1000 * 60 * 60);
        record.totalHours = hours;
        
        if (data.payRate) {
          record.payAmount = hours * data.payRate;
        }
      }

      const docRef = doc(db, COLLECTION_NAME, userEmail, 'records', recordId);
      await setDoc(docRef, record);

      return { success: true, recordId };
    } catch (error) {
      console.error('Error creating manual attendance:', error);
      throw error;
    }
  },

  // Clock in - create new record
  async clockIn(clockInData) {
    try {
      const { userEmail, ...data } = clockInData;
      const recordId = `clockin_${Date.now()}`;
      
      const record = {
        ...data,
        recordId,
        isManual: false,
        clockInTime: Timestamp.now(),
        clockOutTime: null,
        userEmail,
        createdAt: Timestamp.now()
      };

      const docRef = doc(db, COLLECTION_NAME, userEmail, 'records', recordId);
      await setDoc(docRef, record);

      return { success: true, recordId };
    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  },

  // Clock out - update existing record
  async clockOut(userEmail, recordId, clockOutData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, userEmail, 'records', recordId);
      
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Attendance record not found');
      }

      const existingData = docSnap.data();
      const clockOutTime = Timestamp.now();
      
      // Calculate total hours
      const clockInTime = this.convertTimestamp(existingData.clockInTime);
      const timeDiff = clockOutTime.toDate() - clockInTime;
      const hours = timeDiff / (1000 * 60 * 60);
      
      const updates = {
        ...clockOutData,
        clockOutTime,
        totalHours: hours,
        updatedAt: Timestamp.now()
      };

      if (clockOutData.payRate) {
        updates.payAmount = hours * clockOutData.payRate;
      }

      await updateDoc(docRef, updates);

      return { success: true, totalHours: hours };
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  },

  // Get current active session for a user
  async getCurrentSession(userEmail) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const userAttendanceRef = collection(db, COLLECTION_NAME, userEmail, 'records');
      const q = query(
        userAttendanceRef,
        where('clockInTime', '>=', Timestamp.fromDate(today)),
        where('clockOutTime', '==', null),
        orderBy('clockInTime', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          userEmail,
          ...data,
          clockInTime: this.convertTimestamp(data.clockInTime),
          clockOutTime: this.convertTimestamp(data.clockOutTime)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  },

  // Update attendance record
  async updateAttendanceRecord(userEmail, recordId, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, userEmail, 'records', recordId);
      
      if (updates.clockInTime) {
        updates.clockInTime = Timestamp.fromDate(new Date(updates.clockInTime));
      }
      if (updates.clockOutTime) {
        updates.clockOutTime = Timestamp.fromDate(new Date(updates.clockOutTime));
      }

      // Recalculate hours if both times are provided
      if (updates.clockInTime && updates.clockOutTime) {
        const timeDiff = updates.clockOutTime.toDate() - updates.clockInTime.toDate();
        updates.totalHours = timeDiff / (1000 * 60 * 60);
        
        if (updates.payRate) {
          updates.payAmount = updates.totalHours * updates.payRate;
        }
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  // Calculate attendance statistics
  async getAttendanceStats(filters = {}) {
    try {
      const records = await this.getAttendanceRecords(filters);
      
      const stats = {
        totalRecords: records.length,
        totalHours: 0,
        totalEarnings: 0,
        uniqueWorkers: new Set(),
        uniqueSites: new Set(),
        avgHoursPerDay: 0,
        activeWorkers: 0
      };

      records.forEach(record => {
        stats.uniqueWorkers.add(record.userEmail);
        if (record.siteId) stats.uniqueSites.add(record.siteId);
        if (record.siteName) stats.uniqueSites.add(record.siteName);
        if (record.totalHours) stats.totalHours += record.totalHours;
        if (record.payAmount) stats.totalEarnings += record.payAmount;
        if (!record.clockOutTime) stats.activeWorkers += 1;
      });

      const uniqueDays = new Set(
        records.map(r => r.clockInTime ? r.clockInTime.toDateString() : 'Invalid Date')
      ).size;

      stats.avgHoursPerDay = uniqueDays > 0 ? stats.totalHours / uniqueDays : 0;
      stats.uniqueWorkers = stats.uniqueWorkers.size;
      stats.uniqueSites = stats.uniqueSites.size;

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      throw error;
    }
  }
};