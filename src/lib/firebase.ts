
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

// Uncomment and configure when you provide your Firebase config
/*
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
*/

export default firebaseConfig;
