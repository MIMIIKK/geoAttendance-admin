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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
  // Get attendance records for a date range
  async getAttendanceRecords(filters = {}) {
    try {
      const { startDate, endDate, userEmail, siteId } = filters;
      let constraints = [];

      if (startDate) {
        constraints.push(where('clockInTime', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.push(where('clockInTime', '<=', Timestamp.fromDate(endOfDay)));
      }

      const records = [];
      
      if (userEmail) {
        // Get specific user's attendance
        const userAttendanceRef = collection(db, COLLECTION_NAME, userEmail, 'records');
        const q = query(userAttendanceRef, ...constraints, orderBy('clockInTime', 'desc'));
        const snapshot = await getDocs(q);
        
        snapshot.forEach((doc) => {
          records.push({ 
            id: doc.id, 
            userEmail,
            ...doc.data(),
            clockInTime: doc.data().clockInTime?.toDate(),
            clockOutTime: doc.data().clockOutTime?.toDate()
          });
        });
      } else {
        // Get all users' attendance - more complex query
        // For now, we'll need to fetch from each user's subcollection
        // In production, consider using a flat structure or cloud function
      }

      return records;
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
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // This is a simplified version - in production, you'd need to
      // aggregate from all user subcollections or use a different structure
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This would need to be implemented based on your data structure
    // For demonstration, we'll show the pattern
    const unsubscribes = [];

    // You would iterate through users and subscribe to their attendance
    // This is a simplified example
    const unsubscribe = onSnapshot(
      query(
        collection(db, COLLECTION_NAME),
        where('clockInTime', '>=', Timestamp.fromDate(today))
      ),
      (snapshot) => {
        const records = [];
        snapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() });
        });
        callback(records);
      }
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
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
        clockOutTime: data.clockOutTime ? Timestamp.fromDate(new Date(data.clockOutTime)) : null
      };

      const docRef = doc(db, COLLECTION_NAME, userEmail, 'records', recordId);
      await setDoc(docRef, record);

      return { success: true, recordId };
    } catch (error) {
      console.error('Error creating manual attendance:', error);
      throw error;
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
        avgHoursPerDay: 0
      };

      records.forEach(record => {
        stats.uniqueWorkers.add(record.userEmail);
        if (record.siteId) stats.uniqueSites.add(record.siteId);
        if (record.totalHours) stats.totalHours += record.totalHours;
        if (record.payAmount) stats.totalEarnings += record.payAmount;
      });

      const uniqueDays = new Set(
        records.map(r => new Date(r.clockInTime).toDateString())
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