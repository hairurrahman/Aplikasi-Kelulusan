import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loginAdmin(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginSiswa(nisn, tahunAjaran) {
    // Cek siswa di koleksi tahun ajaran tertentu
    const siswaRef = doc(db, `tahunAjaran/${tahunAjaran}/siswa`, nisn);
    const siswaSnap = await getDoc(siswaRef);
    if (!siswaSnap.exists()) {
      throw new Error("NISN tidak ditemukan untuk tahun ajaran ini");
    }
    return { ...siswaSnap.data(), nisn, tahunAjaran };
  }

  function logout() {
    setCurrentUser(null);
    setUserRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if admin
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          setUserRole("admin");
        } else {
          setUserRole("user");
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loginAdmin,
    loginSiswa,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
