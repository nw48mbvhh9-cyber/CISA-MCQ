import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export default app;
