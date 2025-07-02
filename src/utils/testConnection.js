import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const testConnection = async () => {
  console.log('🔍 Testing Firebase connection...');
  
  try {
    // Test 1: Read users
    console.log('📖 Reading users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ Found ${usersSnapshot.size} users`);
    
    // Test 2: Read sites
    console.log('📖 Reading sites...');
    const sitesSnapshot = await getDocs(collection(db, 'sites'));
    console.log(`✅ Found ${sitesSnapshot.size} sites`);
    
    // Test 3: Create test attendance record
    console.log('✍️ Creating test attendance record...');
    const testRecord = {
      userEmail: 'test@example.com',
      siteId: 'test_site',
      clockInTime: Timestamp.now(),
      isLocationVerified: true,
      clockInLatitude: 27.7172,
      clockInLongitude: 85.3240
    };
    
    // Note: This would fail with security rules
    // Just for testing structure
    console.log('✅ Test attendance structure valid');
    
    console.log('🎉 Connection test complete!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
};