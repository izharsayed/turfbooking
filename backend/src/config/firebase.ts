import admin from 'firebase-admin';
import { logger } from './logger.js';

const getFirebaseApp = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('⚠️ Firebase settings missing from environmental variables. Firestore repository falls back.');
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
    return admin.app();
  } catch (error) {
    logger.error('❌ Error initializing Firebase Admin SDK:', error);
    return null;
  }
};

export const firebaseApp = getFirebaseApp();
export const firestoreDb = firebaseApp ? firebaseApp.firestore() : null;
export const firebaseAuth = firebaseApp ? firebaseApp.auth() : null;
