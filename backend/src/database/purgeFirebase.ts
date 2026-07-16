import '../config/env.js';
import { firebaseApp, firebaseAuth, firestoreDb } from '../config/firebase.js';

const confirmation = process.env.CONFIRM_FIREBASE_PURGE;
const expectedConfirmation = 'DELETE_ALL_TURFBOOK_DATA';
const expectedProject = process.env.FIREBASE_PROJECT_ID;

if (confirmation !== expectedConfirmation) {
  throw new Error(`Refusing purge. Set CONFIRM_FIREBASE_PURGE=${expectedConfirmation}.`);
}

if (!firebaseApp || !firestoreDb || !firebaseAuth || !expectedProject) {
  throw new Error('Firebase Admin SDK is not initialized. Check Firebase environment variables.');
}

const deleteFirestore = async (): Promise<void> => {
  const collections = await firestoreDb.listCollections();
  for (const collection of collections) {
    await firestoreDb.recursiveDelete(collection);
    console.log(`Deleted Firestore collection: ${collection.id}`);
  }
};

const deleteAuthUsers = async (): Promise<void> => {
  let pageToken: string | undefined;
  let deletedUsers = 0;
  do {
    const page = await firebaseAuth.listUsers(1000, pageToken);
    if (page.users.length) {
      await firebaseAuth.deleteUsers(page.users.map((user) => user.uid));
      deletedUsers += page.users.length;
      console.log(`Deleted ${page.users.length} Firebase Auth users`);
    }
    pageToken = page.pageToken;
  } while (pageToken);
  console.log(`Firebase Auth users removed: ${deletedUsers}`);
};

const deleteStorageObjects = async (): Promise<void> => {
  const storage = firebaseApp.storage();
  const bucketNames = new Set([
    process.env.FIREBASE_STORAGE_BUCKET,
    `${expectedProject}.appspot.com`,
    `${expectedProject}.firebasestorage.app`,
  ].filter(Boolean) as string[]);
  let foundBucket = false;
  for (const bucketName of bucketNames) {
    const bucket = storage.bucket(bucketName);
    try {
      await bucket.deleteFiles({ force: true });
      foundBucket = true;
      console.log(`Deleted Storage objects from: ${bucket.name}`);
    } catch (error: any) {
      if (error?.code !== 404) throw error;
    }
  }
  if (!foundBucket) {
    console.log('No configured Firebase Storage bucket exists in this project.');
  }
};

const purge = async (): Promise<void> => {
  console.log(`Purging Firebase data for project: ${expectedProject}`);
  await deleteFirestore();
  await deleteAuthUsers();
  await deleteStorageObjects();
  console.log('Firebase data purge complete.');
};

const keepAlive = setInterval(() => undefined, 1_000);
purge()
  .catch((error) => {
    console.error('Firebase data purge failed:', error);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));
