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
  const [isAdmin, setIsAdmin] = useState(null); // Change to null initially
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
      if (!adminDoc.exists()) {
        await logout();
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
      await signOut(auth);
      setIsAdmin(false);
      setAdminCheckComplete(false);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
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
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      const isUserAdmin = adminDoc.exists();
      
      setIsAdmin(isUserAdmin);
      setAdminCheckComplete(true);
      
      return isUserAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          checkAdminStatus(user, retryCount + 1);
        }, delay);
      } else {
        // After 3 retries, set as false but don't block the user if they were previously admin
        if (isAdmin !== true) {
          setIsAdmin(false);
        }
        setAdminCheckComplete(true);
      }
    }
  };

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Only check admin status if we haven't already confirmed they're an admin
        // or if this is a fresh session
        if (!adminCheckComplete || isAdmin === null) {
          await checkAdminStatus(user);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setAdminCheckComplete(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [adminCheckComplete, isAdmin]);

  const value = {
    currentUser,
    isAdmin,
    login,
    logout,
    resetPassword,
    loading: loading || (currentUser && !adminCheckComplete), // Show loading until admin check is complete
    adminCheckComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};