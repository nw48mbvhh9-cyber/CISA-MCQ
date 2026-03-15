import { writeBatch, doc, collection, setDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Parses a JSON file and uploads questions to Firestore in batches.
 * @param {File} file - The JSON file to upload.
 * @param {string} domainName - The domain name to tag questions with.
 * @param {function} onProgress - Callback for progress updates (percentage).
 * @returns {Promise<number>} - Promise resolving to the number of uploaded questions.
 */
export const parseAndUploadQuestions = async (file, domainName, onProgress) => {
    if (!file || !domainName) {
        throw new Error("Please select a file and enter a domain name.");
    }

    const text = await file.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON file.");
    }

    if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of question objects.");
    }

    const total = data.length;
    const batchSize = 400; // Firestore limit is 500, keep safe margin
    let processed = 0;
    const allDocIds = [];

    // chunk array
    for (let i = 0; i < total; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        const batch = writeBatch(db);

        chunk.forEach(item => {
            // Validate essential fields
            if (!item.question || !item.options || !item.correct_answer) {
                console.warn("Skipping invalid item:", item);
                return;
            }

            const docRef = doc(collection(db, 'questions'));
            allDocIds.push(docRef.id);

            const payload = {
                question: item.question,
                options: item.options,
                correct_answer: item.correct_answer,
                explanations: item.explanations || {},
                domain: domainName,
                original_id: item.id || null,
                createdAt: new Date()
            };

            batch.set(docRef, payload);
        });

        await batch.commit();
        processed += chunk.length;
        if (onProgress) onProgress(Math.round((processed / total) * 100));
    }

    // --- Register the Domain with questionIds ---
    try {
        const domainId = domainName.trim();
        const domainRef = doc(db, 'domains', domainId);
        await setDoc(domainRef, {
            name: domainName,
            totalQuestions: total,
            questionIds: allDocIds,
            lastUploadedAt: serverTimestamp(),
            id: domainId
        }, { merge: true });
        console.log(`Domain '${domainName}' registered successfully.`);
    } catch (error) {
        console.error("Error registering domain:", error);
        // We don't throw here to avoid failing the whole UI if just the metadata write fails, 
        // as the questions are already uploaded.
    }

    return total;
};

/**
 * Scans all questions to rebuild the 'domains' collection.
 * Useful for syncing metadata for pre-existing questions.
 */
export const scanDomains = async (setScanProgress) => {
    try {
        const q = query(collection(db, 'questions'));
        const snapshot = await getDocs(q);
        const total = snapshot.size;

        if (total === 0) return 0;

        const domainMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const dName = data.domain || "Unknown Domain";
            if (!domainMap[dName]) {
                domainMap[dName] = { count: 0, ids: [] };
            }
            domainMap[dName].count++;
            domainMap[dName].ids.push(doc.id);
        });

        const domains = Object.keys(domainMap);
        let processed = 0;

        for (const domainName of domains) {
            const domainId = domainName.trim();
            const { count, ids } = domainMap[domainName];

            await setDoc(doc(db, 'domains', domainId), {
                name: domainName,
                totalQuestions: count,
                questionIds: ids,
                lastUploadedAt: serverTimestamp(),
                id: domainId
            }, { merge: true });

            processed++;
            if (setScanProgress) setScanProgress(Math.round((processed / domains.length) * 100));
        }

        return domains.length;

    } catch (error) {
        console.error("Error scanning domains:", error);
        throw error;
    }
};
