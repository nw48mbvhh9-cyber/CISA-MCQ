import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, createUserDocument, getRedirectResult } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle Google redirect sign-in result (mobile flow)
        getRedirectResult(auth).catch((error) => {
            if (error.code !== 'auth/no-current-user') {
                console.error('Google redirect sign-in error:', error);
            }
        });

        let unsubscribeFirestore = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Create/Ensure user document exists
                await createUserDocument(currentUser);
                setUser(currentUser);

                // 2. Real-time listener for role and db user object
                const userDocRef = doc(db, 'users', currentUser.uid);
                unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setDbUser(data);
                        // Check for 'role' (created by code) or 'Role' (manually added by user)
                        const userRole = data.role || data.Role || 'user';
                        // Also normalize the value to lowercase for comparison
                        setRole(userRole.toLowerCase());
                    } else {
                        setRole('user');
                        setDbUser(null);
                    }
                    setLoading(false); // Only set loading to false after we get existing data
                }, (error) => {
                    console.error("Error fetching user role:", error);
                    setRole('user');
                    setDbUser(null);
                    setLoading(false);
                });

            } else {
                setUser(null);
                setRole(null);
                setDbUser(null);
                if (unsubscribeFirestore) {
                    unsubscribeFirestore();
                }
                setLoading(false);
            }
        });

        // Cleanup function
        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    return {
        user,
        dbUser,
        role,
        isAdmin: role === 'admin',
        loading
    };
};
