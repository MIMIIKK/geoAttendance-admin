import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'sites';

export const siteService = {
  // Create new site
  async createSite(siteData) {
    try {
      const siteId = `site_${Date.now()}`;
      const site = {
        ...siteData,
        siteId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, COLLECTION_NAME, siteId), site);
      
      return { 
        success: true, 
        site,
        message: 'Site created successfully' 
      };
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  },

  // Get all sites
  async getSites(activeOnly = false) {
    try {
      let q = collection(db, COLLECTION_NAME);
      
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }
      
      q = query(q, orderBy('siteName'));
      
      const snapshot = await getDocs(q);
      const sites = [];
      
      snapshot.forEach((doc) => {
        sites.push({ id: doc.id, ...doc.data() });
      });
      
      return sites;
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  },

  // Get single site
  async getSite(siteId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, siteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      throw new Error('Site not found');
    } catch (error) {
      console.error('Error fetching site:', error);
      throw error;
    }
  },

  // Update site
  async updateSite(siteId, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, siteId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
      return { success: true, message: 'Site updated successfully' };
    } catch (error) {
      console.error('Error updating site:', error);
      throw error;
    }
  },

  // Delete site (soft delete)
  async deleteSite(siteId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, siteId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, message: 'Site deactivated successfully' };
    } catch (error) {
      console.error('Error deleting site:', error);
      throw error;
    }
  },

  // Get sites with worker count
  async getSitesWithStats() {
    try {
      const sites = await this.getSites();
      // TODO: Add worker count from workers collection
      return sites.map(site => ({
        ...site,
        workerCount: 0 // Will be implemented with worker service
      }));
    } catch (error) {
      console.error('Error fetching sites with stats:', error);
      throw error;
    }
  },

  // Search sites by name or address
  async searchSites(searchTerm) {
    try {
      const sites = await this.getSites();
      
      const filtered = sites.filter(site => 
        site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      console.error('Error searching sites:', error);
      throw error;
    }
  }
};