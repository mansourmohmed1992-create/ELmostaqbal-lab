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

// Firebase Configuration
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

// ============= User Roles & Permissions =============
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
}

// قائمة المستخدمين المسموح لهم بالتسجيل التلقائي (فقط admin)
const ALLOWED_AUTO_REGISTER_EMAILS = ['admin@elmostaqbal-lab.com'];

// ============= Authentication with Auto-Register =============
export const smartLogin = async (email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  role?: UserRole;
  error?: string;
  isNewUser?: boolean;
}> => {
  // تنسيق البريد الإلكتروني
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // محاولة تسجيل دخول عادي
    const loginAttempt = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    
    // تحميل بيانات المستخدم
    const userProfile = await getUserProfile(loginAttempt.user.uid);
    await updateLastLogin(loginAttempt.user.uid);
    
    return {
      success: true,
      user: loginAttempt.user,
      role: userProfile?.role || 'CLIENT',
      isNewUser: false
    };
  } catch (loginError: any) {
    // إذا كان المستخدم غير موجود والإيميل مسموح بإنشاء تلقائي
    if (loginError.code === 'auth/user-not-found') {
      if (ALLOWED_AUTO_REGISTER_EMAILS.includes(normalizedEmail)) {
        return smartAutoRegister(normalizedEmail, password);
      } else {
        return {
          success: false,
          error: 'هذا الإيميل غير مسجل. يرجى التواصل مع الإدارة للتسجيل.'
        };
      }
    }
    
    // معالجة أخطاء أخرى
    return {
      success: false,
      error: getErrorMessage(loginError.code)
    };
  }
};

// تسجيل تلقائي آمن (فقط الإيميلات المسموحة)
const smartAutoRegister = async (
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: any;
  role?: UserRole;
  error?: string;
  isNewUser?: boolean;
}> => {
  try {
    const newUser = await createUserWithEmailAndPassword(auth, email, password);
    
    // تحديد الدور بناءً على الإيميل
    const role: UserRole = email === 'admin@elmostaqbal-lab.com' ? 'ADMIN' : 'CLIENT';
    
    // حفظ ملف المستخدم في قاعدة البيانات
    const userProfile: UserProfile = {
      uid: newUser.user.uid,
      email: email,
      displayName: email.split('@')[0],
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    await set(ref(db, `users/${newUser.user.uid}`), userProfile);
    
    return {
      success: true,
      user: newUser.user,
      role: role,
      isNewUser: true
    };
  } catch (error: any) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

// ============= User Profile Management =============
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snapshot = await get(ref(db, `users/${uid}`));
    return snapshot.val() as UserProfile | null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateLastLogin = async (uid: string) => {
  try {
    await update(ref(db, `users/${uid}`), {
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

// ============= Authorization Helpers =============
export const hasRole = async (uid: string, requiredRole: UserRole): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  if (!profile) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    'ADMIN': 3,
    'EMPLOYEE': 2,
    'CLIENT': 1
  };
  
  return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
};

export const isAdmin = async (uid: string): Promise<boolean> => {
  return hasRole(uid, 'ADMIN');
};

// ============= Error Messages =============
const getErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة',
    'auth/user-not-found': 'المستخدم غير مسجل',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/weak-password': 'كلمة المرور ضعيفة (8 أحرف على الأقل)',
    'auth/email-already-in-use': 'هذا الإيميل مسجل بالفعل',
    'auth/operation-not-allowed': 'هذه العملية غير مسموحة',
  };
  
  return messages[code] || 'حدث خطأ في تسجيل الدخول';
};

// ============= Legacy Functions (for backward compatibility) =============
export const loginUser = async (email: string, password: string) => {
  const result = await smartLogin(email, password);
  if (result.success) {
    return {
      success: true,
      user: result.user,
      role: result.role
    };
  }
  return {
    success: false,
    error: result.error
  };
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
