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
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from './firebase';

const COLLECTION_NAME = 'users';

export const workerService = {
  // Create new worker with Firebase Auth and Firestore, send password reset email
  async createWorker(workerData) {
    try {
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      // Create Firebase Auth user
      const authResult = await createUserWithEmailAndPassword(
        auth,
        workerData.email,
        tempPassword
      );

      // Construct worker document
      const worker = {
        ...workerData,
        uid: authResult.user.uid,
        role: 'worker',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore using email as document ID
      await setDoc(doc(db, COLLECTION_NAME, workerData.email), worker);

      // Send password reset email so user can set own password
      await sendPasswordResetEmail(auth, workerData.email);

      return {
        success: true,
        worker,
        tempPassword,
        message: 'Worker created successfully. Password reset email sent.',
      };
    } catch (error) {
      console.error('Error creating worker:', error);
      throw error;
    }
  },

  // Get all workers with optional filters (siteId, isActive)
  async getWorkers(filters = {}) {
    try {
      let baseQuery = collection(db, COLLECTION_NAME);
      const queryConstraints = [];

      if (filters.siteId) {
        queryConstraints.push(where('siteId', '==', filters.siteId));
      }
      if (filters.isActive !== undefined) {
        queryConstraints.push(where('isActive', '==', filters.isActive));
      }
      queryConstraints.push(orderBy('name'));

      const q = query(baseQuery, ...queryConstraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },

  // Get a single worker by email (document ID)
  async getWorker(email) {
    try {
      const docRef = doc(db, COLLECTION_NAME, email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Worker not found');
      }
    } catch (error) {
      console.error('Error fetching worker:', error);
      throw error;
    }
  },

  // Update a worker document by email
  async updateWorker(email, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, email);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, updateData);
      return { success: true, message: 'Worker updated successfully' };
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  },

  // Soft delete (deactivate) a worker by email
  async deleteWorker(email) {
    try {
      const docRef = doc(db, COLLECTION_NAME, email);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });

      return { success: true, message: 'Worker deactivated successfully' };
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw error;
    }
  },

  // Client-side search filtering on name, email, phoneNumber
  async searchWorkers(searchTerm) {
    try {
      const allWorkers = await this.getWorkers();
      const lowerTerm = searchTerm.toLowerCase();

      return allWorkers.filter(worker =>
        (worker.name?.toLowerCase().includes(lowerTerm)) ||
        (worker.email?.toLowerCase().includes(lowerTerm)) ||
        (worker.phoneNumber?.includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching workers:', error);
      throw error;
    }
  }
};
