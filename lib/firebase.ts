import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase is used only for admin authentication.
// Rooms & bookings data is stored in the local JSON database (data/db.json).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAJxHhakZ4YXOGTYSw4j7VeCyEjtrtt7Bc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cho-thue-phong-bbea9.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cho-thue-phong-bbea9',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'cho-thue-phong-bbea9.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '798670899421',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:798670899421:web:480340c24ca7cda376b334',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-6LD4W57KE3',
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export default app
