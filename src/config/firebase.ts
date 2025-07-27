// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzN28K_AwTXSmc6MUBslMTUTttczbYQL8",
  authDomain: "lagordabellamarqueket.firebaseapp.com",
  projectId: "lagordabellamarqueket",
  storageBucket: "lagordabellamarqueket.firebasestorage.app",
  messagingSenderId: "1001136794906",
  appId: "1:1001136794906:web:af552db57141260d4910a3",
  measurementId: "G-LJVVKX0D0Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;