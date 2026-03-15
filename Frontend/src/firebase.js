import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCBkbti7IRlfJmsnGNVHRlNAhE2ZydGpZY",
    authDomain: "cisa-master.firebaseapp.com",
    projectId: "cisa-master",
    storageBucket: "cisa-master.firebasestorage.app",
    messagingSenderId: "676509282736",
    appId: "1:676509282736:web:0eae445bd7a15196a12675",
    measurementId: "G-N9WF0KGZD2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export { getRedirectResult };

export const signInWithGoogle = async () => {
    try {
        if (isMobileDevice()) {
            // Mobile browsers block popups — use redirect flow instead
            await signInWithRedirect(auth, googleProvider);
            return; // Page will redirect; onAuthStateChanged handles sign-in on return
        }
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const registerWithEmail = async (email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error registering with email", error);
        throw error;
    }
};

export const loginWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error logging in with email", error);
        throw error;
    }
};

export const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    let ipData = {};
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            ipData = {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country_name
            };
        }
    } catch (e) {
        console.warn("Could not fetch IP data", e);
    }

    if (!snapshot.exists()) {
        const { email, displayName, photoURL } = user;
        const createdAt = new Date();

        try {
            await setDoc(userRef, {
                displayName: displayName || email.split('@')[0],
                email,
                photoURL: photoURL || null,
                createdAt,
                role: 'user', // Default role
                approvedModules: [],
                requestedModules: [],
                lastLoginInfo: ipData,
                ...additionalData
            });
        } catch (error) {
            console.error('Error creating user document', error);
        }
    } else {
        // Update last login info for existing users
        try {
            await setDoc(userRef, {
                lastLoginInfo: ipData,
                ...additionalData
            }, { merge: true });
        } catch (error) {
            console.error('Error updating user document', error);
        }
    }
    return userRef;
};

export default app;
