// js/common.js

// Login Page Logic
const form = document.getElementById('adminLoginForm');
const loginStatus = document.getElementById('loginStatus');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Hardcoded credentials for admin
        const defaultUsername = 'Admin';
        const defaultPassword = 'Usman@2006';

        if (username === defaultUsername && password === defaultPassword) {
            localStorage.setItem('isAdmin', 'true');
            window.location.href = 'adminDashboard.html';
        } else {
            loginStatus.innerText = 'Invalid username or password';
            loginStatus.style.display = 'block';
        }
    });
}

// Dashboard Page Protection
if (window.location.href.includes('adminDashboard.html')) {
    if (localStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'login.html'; // change if your login page is named differently
    }

    // Optional logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('isAdmin');
            window.location.href = '../index.html';
        });
    }
}

/**
 * Loads a JSON file from /assets and returns the parsed object.
 * @param {string} fileName - e.g., 'courses.json'
 * @returns {Promise<Object>}
 */
async function loadJSON(fileName) {
    const res = await fetch(`../assets/${fileName}`);
    if (!res.ok) throw new Error(`Failed to load ${fileName}`);
    return await res.json();
}

/**
 * Store data to localStorage under key
 * @param {string} key 
 * @param {Object|Array|string} value 
 */
function saveToLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieve parsed JSON from localStorage
 * @param {string} key 
 * @returns {Object|Array|null}
 */
function loadFromLocal(key) {
    const val = localStorage.getItem(key);
    try {
        return JSON.parse(val);
    } catch {
        return null;
    }
}

/**
 * Format a slot timing (e.g., 'A1' → 'Mon 8:00–8:50')
 * @param {string} slot - e.g., 'A1'
 * @param {Object} timetable - loaded from timetable.json
 * @returns {string}
 */
function formatSlot(slot, timetable) {
    if (!timetable[slot]) return 'N/A';
    return `${timetable[slot].day} ${timetable[slot].time}`;
}

/**
 * Simple toast alert
 * @param {string} msg 
 * @param {string} type - success | error | info
 */

// Smooth page transition on navigation
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a[href]");

    links.forEach(link => {
        const url = new URL(link.href, window.location.href);

        // Only apply to same-origin links (not external or download links)
        if (url.origin === location.origin) {
            link.addEventListener("click", function (e) {
                // Ignore if target="_blank" or with modifiers
                if (
                    link.target === "_blank" ||
                    e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
                ) return;

                e.preventDefault(); // Stop immediate navigation
                document.body.classList.add("fade-out");

                setTimeout(() => {
                    window.location.href = link.href;
                }, 500); // Match the CSS transition duration
            });
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = '1';
});

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const typeColor = {
        success: '#198754', // green
        warning: '#ffc107', // yellow
        danger: '#dc3545',  // red
        info: '#0dcaf0'     // blue
    };

    toast.className = 'toast align-items-center show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.style.backgroundColor = '#fff'; // White background
    toast.style.color = '#000';           // Black text
    toast.style.borderLeft = `5px solid ${typeColor[type] || '#198754'}`;
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.padding = '12px 16px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.maxWidth = '300px';

    toast.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>${message}</div>
            <button type="button" class="btn-close ms-3" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('fade');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Load Lottie JSON animation into the container
const animContainer = document.getElementById('lottieAnimation');
if (animContainer) {
    // Load Lottie script dynamically only when required
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.0/lottie.min.js';
    script.onload = () => {
        lottie.loadAnimation({
            container: animContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: './animations/register.json'
        });
    };
    document.head.appendChild(script);
}