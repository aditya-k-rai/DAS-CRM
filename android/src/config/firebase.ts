/**
 * firebase.ts — Universal Firebase SDK Configuration for DAS CRM (Android / Mobile)
 * Project: das-crm0
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "das-crm0.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "das-crm0",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "das-crm0.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "932773366247",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:932773366247:web:42840af78aac57467e1542",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-J25G76SFZF",
};

export default firebaseConfig;
