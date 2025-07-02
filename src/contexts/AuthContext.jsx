import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
      if (!adminDoc.exists()) {
        await signOut(auth); // Use signOut directly instead of logout to avoid recursion
        throw new Error('Access denied. Admin privileges required.');
      }
      
      setIsAdmin(true);
      setAdminCheckComplete(true);
      toast.success('Login successful!');
      return result.user;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear local state immediately
      setIsAdmin(null);
      setAdminCheckComplete(false);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Additional cleanup
      setCurrentUser(null);
      
      toast.success('Logged out successfully');
      
      // Force redirect to login page
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      
      // Even if logout fails, clear local state and redirect
      setCurrentUser(null);
      setIsAdmin(null);
      setAdminCheckComplete(false);
      window.location.href = '/login';
      
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Check admin status with retry logic
  const checkAdminStatus = async (user, retryCount = 0) => {
    try {
      console.log(`Checking admin status for user: ${user.uid}, attempt: ${retryCount + 1}`);
      
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      const isUserAdmin = adminDoc.exists();
      
      console.log(`Admin check result: ${isUserAdmin}`);
      
      setIsAdmin(isUserAdmin);
      setAdminCheckComplete(true);
      
      return isUserAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying admin check in ${delay}ms`);
        setTimeout(() => {
          checkAdminStatus(user, retryCount + 1);
        }, delay);
      } else {
        console.warn('Max retries reached for admin check');
        // After 3 retries, set as false
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    }
  };

  // Auth state observer
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      if (user) {
        setCurrentUser(user);
        
        // Always check admin status for authenticated users
        // But skip if we just confirmed admin status in login
        if (!adminCheckComplete) {
          await checkAdminStatus(user);
        }
      } else {
        // User signed out - clear all state
        console.log('User signed out, clearing state');
        setCurrentUser(null);
        setIsAdmin(null);
        setAdminCheckComplete(false);
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []); // Remove dependencies to avoid re-creating the listener

  // Separate effect to handle admin status changes
  useEffect(() => {
    if (currentUser && isAdmin === false && adminCheckComplete) {
      console.log('User is not admin, should redirect to login');
      // Don't auto-logout here, let PrivateRoute handle the redirect
    }
  }, [currentUser, isAdmin, adminCheckComplete]);

  const value = {
    currentUser,
    isAdmin,
    login,
    logout,
    resetPassword,
    loading,
    adminCheckComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};