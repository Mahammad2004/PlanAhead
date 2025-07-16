// utils/clashDetector.js

import { slotTimeMap } from "../assets/slotTimeMap.js"; // <-- Make sure you place the file here

/**
 * Extract individual slot codes from composite strings like "B1+TB1", "TC2/G2"
 */
function extractSlots(slotString) {
    return slotString
        .split('+')
        .flatMap(s => (s.includes('/') ? s.split('/') : [s]))
        .map(s => s.trim());
}

/**
 * Convert "HH:MM" time string to minutes (for comparison)
 */
function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Check if two time blocks overlap on the same day
 */
function timeBlocksOverlap(tb1, tb2) {
    if (tb1.day !== tb2.day) return false;

    const start1 = timeToMinutes(tb1.start);
    const end1 = timeToMinutes(tb1.end);
    const start2 = timeToMinutes(tb2.start);
    const end2 = timeToMinutes(tb2.end);

    return !(end1 <= start2 || end2 <= start1);
}

/**
 * Get all time blocks for a course slot (composite or single)
 */
function getTimeBlocks(slotString) {
    const slots = extractSlots(slotString);
    return slots.flatMap(slot => slotTimeMap[slot] || []);
}

/**
 * Check if the new course clashes with any selected course based on time
 */
function checkClash(selectedCourses, newCourse) {
    const newBlocks = getTimeBlocks(newCourse.slot);

    for (const course of selectedCourses) {
        const existingBlocks = getTimeBlocks(course.slot);

        for (const b1 of newBlocks) {
            for (const b2 of existingBlocks) {
                if (timeBlocksOverlap(b1, b2)) {
                    return true; // Clash found
                }
            }
        }
    }

    return false;
}

/**
 * Get list of clashing course codes
 */
function getClashingCourses(selectedCourses, newCourse) {
    const clashes = [];
    const newBlocks = getTimeBlocks(newCourse.slot);

    for (const course of selectedCourses) {
        const existingBlocks = getTimeBlocks(course.slot);

        for (const b1 of newBlocks) {
            for (const b2 of existingBlocks) {
                if (timeBlocksOverlap(b1, b2)) {
                    clashes.push(course.code);
                    break;
                }
            }
        }
    }

    return clashes;
}

// Export globally so you can use ClashDetector in student.js
window.ClashDetector = {
    extractSlots,
    checkClash,
    getClashingCourses
};
