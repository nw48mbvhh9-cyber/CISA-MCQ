import { doc, getDocs, collection, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Request access to a domain.
 * Adds the domainId to the user's requestedModules array.
 */
export const requestDomainAccess = async (userId, domainId) => {
    if (!userId || !domainId) throw new Error("Missing userId or domainId");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        requestedModules: arrayUnion(domainId)
    });
};

/**
 * Approve access to a domain.
 * Removes from requestedModules and adds to approvedModules.
 */
export const approveDomainAccess = async (userId, domainId) => {
    if (!userId || !domainId) throw new Error("Missing userId or domainId");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        requestedModules: arrayRemove(domainId),
        approvedModules: arrayUnion(domainId)
    });
};

/**
 * Revoke or remove access to a domain.
 */
export const removeDomainAccess = async (userId, domainId) => {
    if (!userId || !domainId) throw new Error("Missing userId or domainId");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        approvedModules: arrayRemove(domainId)
    });
};

/**
 * Fetches all users from Firestore (Admin only).
 */
export const getAllUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};
