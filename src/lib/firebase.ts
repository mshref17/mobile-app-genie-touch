
// Firebase configuration - you'll need to replace this with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "AIzaSyDWBd4BY9pKYpYA2AlQu2f637WOFYM088g",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "pt-forum-5a586",
  storageBucket: "pt-forum-5a586.appspot.com",
  messagingSenderId: "1022269708142",
  appId: "1:1022269708142:android:b1ef0db156f36f4151d37f"
};

// Firebase services initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default firebaseConfig;
