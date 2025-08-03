import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

if (!admin.apps.length) {
  // Check if Firebase credentials are provided
  const hasFirebaseCredentials = 
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_CLIENT_EMAIL && 
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasFirebaseCredentials) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } else {
    console.warn('Firebase credentials not provided. Firebase authentication will be disabled.');
    // Initialize with minimal config to prevent crashes
    admin.initializeApp({
      projectId: 'fiar-development',
    });
  }
}

export default admin;
