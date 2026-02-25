import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  push, 
  update,
  remove,
  onValue,
  DatabaseReference
} from 'firebase/database';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
  User
} from 'firebase/auth';

// Firebase Configuration - استخدم إعدادات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyC9j7Py1QXqUp_oyhxhpLKqOIiqKIVVOCI",
  authDomain: "elmostaqbal-lab.firebaseapp.com",
  databaseURL: "https://elmostaqbal-lab-default-rtdb.firebaseio.com",
  projectId: "elmostaqbal-lab",
  storageBucket: "elmostaqbal-lab.firebasestorage.app",
  messagingSenderId: "928973377355",
  appId: "1:928973377355:web:f42ce1683957c3e44722ce",
  measurementId: "G-2GWQRQYZDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ============= Authentication =============
export const registerUser = async (email: string, password: string, userData: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // حفظ بيانات المستخدم في Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      email: user.email,
      ...userData,
      createdAt: new Date().toISOString()
    });
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // تحميل بيانات المستخدم من Realtime Database
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    return { success: true, user: { ...user, ...userData } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
};

// ============= Database Helpers =============
export const saveData = async (path: string, data: any) => {
  try {
    await set(ref(db, path), data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getData = async (path: string) => {
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.val();
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return null;
  }
};

export const pushData = async (path: string, data: any) => {
  try {
    const newRef = await push(ref(db, path), data);
    return { success: true, key: newRef.key };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateData = async (path: string, data: any) => {
  try {
    await update(ref(db, path), data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteData = async (path: string) => {
  try {
    await remove(ref(db, path));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const subscribeToData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(db, path);
  onValue(dataRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export { auth, db };
