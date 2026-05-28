import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB7sjlt77vNnpRtgALP7ytCWIPSMddn93c",
  authDomain: "aplikasi-kelulusan-sd.firebaseapp.com",
  projectId: "aplikasi-kelulusan-sd",
  storageBucket: "aplikasi-kelulusan-sd.firebasestorage.app",
  messagingSenderId: "156755270940",
  appId: "1:156755270940:web:45ec54f01cf5354c6e2ed9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
