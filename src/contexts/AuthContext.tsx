
import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  deleteUser as deleteFirebaseUser,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { toast } from "sonner";

export interface AuthUser extends User {
  role?: string;
  bloodGroup?: string;
  age?: number;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  course?: string;
  year?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string, role: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Register a new user
  const register = async (email: string, password: string, role: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName: name });
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
        status: "active"
      });
      
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register");
      throw error;
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to logout");
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<AuthUser>) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      
      // Update Firestore document
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...data
      });
      
      // Update local state
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  // Change password
  const changePassword = async (newPassword: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      
      await updatePassword(currentUser, newPassword);
      toast.success("Password changed successfully!");
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || "Failed to change password");
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", currentUser.uid));
      
      // Delete Firebase auth user
      await deleteFirebaseUser(currentUser);
      
      toast.success("Account deleted successfully!");
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast.error(error.message || "Failed to delete account");
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setCurrentUser({ ...user, ...userData } as AuthUser);
          } else {
            setCurrentUser(user as AuthUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user as AuthUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    changePassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
