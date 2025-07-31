import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBHm9-U1vtQaCW1R2JfXUobHtr1o5rpuO4",
  authDomain: "petapp-5d898.firebaseapp.com",
  projectId: "petapp-5d898",
  storageBucket: "petapp-5d898.appspot.com", // ✅ FIXED
  messagingSenderId: "167635346779",
  appId: "1:167635346779:web:c0b0549563071f87c8667e",
  measurementId: "G-42HS6YNVBY",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
