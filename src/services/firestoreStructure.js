// Standardized Firestore structure for both platforms
export const COLLECTIONS = {
  USERS: 'users',
  SITES: 'sites',
  ATTENDANCE: 'attendance',
  ADMINS: 'admins'
};

export const firestoreStructure = {
  // User document structure
  user: {
    email: '',
    name: '',
    role: 'worker', // 'worker' or 'admin'
    siteId: '',
    siteName: '',
    payRate: 0,
    phoneNumber: '',
    isActive: true,
    createdAt: '', // ISO string
    updatedAt: '' // ISO string
  },

  // Site document structure
  site: {
    siteId: '',
    siteName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radiusInMeters: 15,
    isActive: true,
    createdAt: '', // ISO string
    updatedAt: '' // ISO string
  },

  // Attendance record structure
  attendance: {
    recordId: '',
    userEmail: '',
    siteId: '',
    clockInTime: null, // Timestamp
    clockOutTime: null, // Timestamp
    clockInLatitude: 0,
    clockInLongitude: 0,
    clockOutLatitude: 0,
    clockOutLongitude: 0,
    totalHours: 0,
    payAmount: 0,
    isLocationVerified: false,
    isManual: false,
    notes: ''
  }
};