// admin/js/admin.js

let catalog = [];

const creditMap = {
    // 4 CREDIT
    'A1+TA1+TAA1': 4, 'B1+TB1+TBB1': 4, 'C1+TC1+TCC1': 4, 'C1+SC1+TC1': 4,
    'D1+TD1+TDD1': 4, 'D1+TD1+SD1': 4, 'A2+TA2+TAA2': 4, 'B2+TB2+TBB2': 4,
    'C2+TC2+TCC2': 4, 'C2+SC2+TC2': 4, 'D2+TD2+TDD2': 4, 'D2+SD2+TD2': 4,
    'E1+TE1+TEE1': 4, 'E1+SE1+TEE1': 4, 'F1+TF1+TFF1': 4, 'F1+TF1+TBB2': 4,
    'G1+TG1+TGG1': 4, 'G1+TG1+TGG2': 4,

    // 3 CREDIT
    'A1+TA1': 3, 'B1+TB1': 3, 'C1+TC1': 3, 'D1+TD1': 3,
    'E1+TE1': 3, 'E1+TEE1': 3, 'F1+TF1': 3, 'F1+TFF1': 3,
    'G1+TG1': 3, 'G1+TGG1': 3, 'C1+TC1': 3, 'C1+TC1': 3, 'D1+TDD1': 3,
    'A2+TA2': 3, 'B2+TB2': 3, 'C2+TC2': 3, 'C2+TCC2': 3,
    'D2+TD2': 3, 'E2+TE2': 3, 'E2+TEE2': 3, 'F2+TF2': 3, 'F2+TFF2': 3,
    'G2+TG2': 3,

    // 2 CREDIT
    'A1': 2, 'B1': 2, 'C1': 2, 'D1': 2, 'E1': 2, 'F1': 2,
    'A2': 2, 'B2': 2, 'C2': 2, 'D2': 2, 'E2': 2, 'F2': 2,

    // 1 CREDIT
    'TA1': 1, 'TB1': 1, 'TC1': 1, 'TD1': 1, 'TE1': 1, 'TF1': 1,
    'TG1': 1, 'TEE1': 1, 'TCC1': 1, 'TDD1': 1, 'TAA1': 1, 'TBB1': 1,
    'TA2': 1, 'TB2': 1, 'TC2': 1, 'TD2': 1, 'TE2': 1, 'TF2': 1,
    'TG2': 1, 'TAA2': 1, 'TBB2': 1, 'TCC2': 1, 'TDD2': 1, 'TEE2': 1
};

// -------- File Upload Logic (Excel/CSV) --------
document.getElementById('catalogFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
        alert("⚠️ PDF parsing not supported for data. Use Excel/CSV.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // All rows
        const headers = raw[1]; // 2nd row is header
        const rows = raw.slice(2); // From 3rd row onwards

        function getCreditsFromSlot(slot, code = "") {
            const normalized = slot.trim().toUpperCase();
            const courseCode = code.trim().toUpperCase();

            // Special case: Capstone and Ethics
            if (courseCode === "CAP4001") return 6;
            if (courseCode === "MGT1001") return 2;

            // Exact match from predefined map
            if (creditMap[normalized]) return creditMap[normalized];

            const parts = normalized.split('+');

            // Check if all parts are labs like L1, L2, etc.
            const isAllLab = parts.every(p => /^L\d{1,2}$/.test(p));

            if (isAllLab) {
                // L1+L2 or L21+L22+L23+L24 → 2 credits max
                return parts.length >= 4 ? 2 : 1;
            }

            // Fallback guess based on number of components (for lecture slots)
            if (parts.length === 3) return 4;
            if (parts.length === 2) return 3;
            if (parts.length === 1) return 2;

            return '';
        }

        rows.forEach(row => {
            const course = {};
            headers.forEach((key, i) => {
                course[key] = row[i] !== undefined ? row[i] : '';
            });

            catalog.push({
                code: course['COURSE CODE'] ?? course['Course Code'] ?? '',
                title: course['COURSE TITLE'] ?? course['Course Title'] ?? '',
                type: course['COURSE TYPE'] ?? course['Course Type'] ?? '',
                slot: course['SLOT'] ?? course['Slot'] ?? '',
                credits: course['CREDITS'] ?? course['Credits'] ?? getCreditsFromSlot(course['SLOT'] || '', course['COURSE CODE'] || course['Course Code']) ?? ''
            });
        });

        renderCourses();
    };


    reader.readAsArrayBuffer(file);
});

// -------- Manual Add Logic --------
document.getElementById('manualCourseForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const code = document.getElementById('courseCode').value.trim();
    const title = document.getElementById('courseTitle').value.trim();
    const type = document.getElementById('courseType').value;
    const slot = document.getElementById('courseSlot').value.trim();
    const credits = parseInt(document.getElementById('courseCredits').value);

    if (!code || !title || !slot || isNaN(credits)) {
        alert("⚠️ Please fill all fields correctly.");
        return;
    }

    catalog.push({ code, title, type, slot, credits });
    renderCourses();
    e.target.reset();
});

// -------- Search Logic --------
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('searchInput').addEventListener('input', () => renderCourses(1));
});


// -------- Render Table --------
let currentPage = 1;
const rowsPerPage = 50;

function renderCourses(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('courseTableBody');
    const query = document.getElementById('searchInput').value.toLowerCase();
    tbody.innerHTML = '';

    const filtered = catalog.filter(c =>
        c.code.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.slot.toLowerCase().includes(query)
    );

    const start = (page - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    paginated.forEach((course, i) => {
        const tr = document.createElement('tr');
        tr.classList.add('course-row');
        tr.innerHTML = `
      <td>${start + i + 1}</td>
      <td>${course.code}</td>
      <td>${course.title}</td>
      <td>${course.type}</td>
      <td>${course.slot}</td>
      <td>${course.credits || creditMap[course.slot] || getCreditsFromSlot(course.slot)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeCourseByCode('${course.code}')">Remove</button></td>
    `;
        tbody.appendChild(tr);
    });

    renderPagination(filtered.length);
}

function removeCourseByCode(code) {
    const index = catalog.findIndex(c => c.code === code);
    if (index !== -1) {
        catalog.splice(index, 1);
        renderCourses(currentPage);
    }
}

function renderPagination(totalRows) {
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    if (totalPages <= 1) return; // No need for pagination

    const createBtn = (label, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm mx-1 ${isActive ? 'btn-primary' : 'btn-outline-primary'}`;
        btn.textContent = label;
        btn.disabled = isDisabled;
        btn.onclick = () => renderCourses(page);
        return btn;
    };

    // Prev button
    container.appendChild(createBtn('« Prev', currentPage - 1, false, currentPage === 1));

    // Page numbers (show max 5 pages: current ±2)
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    if (start > 1) container.appendChild(createBtn('1', 1));
    if (start > 2) container.appendChild(createBtn('...', currentPage, false, true));

    for (let i = start; i <= end; i++) {
        container.appendChild(createBtn(i, i, i === currentPage));
    }

    if (end < totalPages - 1) container.appendChild(createBtn('...', currentPage, false, true));
    if (end < totalPages) container.appendChild(createBtn(totalPages, totalPages));

    // Next button
    container.appendChild(createBtn('Next »', currentPage + 1, false, currentPage === totalPages));
}

function removeCourse(index) {
    catalog.splice(index, 1);
    renderCourses();
}

// -------- Export to JSON --------
function exportCatalogToJSON() {
    const json = JSON.stringify(catalog, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "courses.json";
    a.click();

    URL.revokeObjectURL(url);
}

// Handle Excel Upload
document.getElementById('slotExcelFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // 1. Show preview
        renderSlotGridTable(sheet);

        // 2. Save full raw grid for export
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        localStorage.setItem('timetableGridRaw', JSON.stringify(raw, null, 2));
    };

    reader.readAsArrayBuffer(file);
});


// Render PDF-style timetable table (visual preview)
function renderSlotGridTable(sheet) {
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const table = document.getElementById("slotGridPreview");
    table.innerHTML = "";

    const maxCols = Math.max(...raw.map(row => row.length));

    raw.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        if (rowIndex === 0) {
            const th = document.createElement("th");
            th.colSpan = maxCols;
            th.textContent = row[0] || "Slot Timetable";
            th.className = "text-center fw-bold text-uppercase bg-light";
            th.style.fontSize = "16px";
            th.style.padding = "12px";
            tr.appendChild(th);
        } else {
            for (let i = 0; i < maxCols; i++) {
                const cell = row[i] || "";
                const tag = i === 0 ? "th" : "td";
                const td = document.createElement(tag);
                td.textContent = cell;
                tr.appendChild(td);
            }
        }

        table.appendChild(tr);
    });
}

// Extract Slot Code → Day & Time Mapping
function generateSlotMapFromExcel(sheet) {
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const days = raw[0].slice(1); // header: skip first cell ("Time")
    const map = {};

    for (let i = 1; i < raw.length; i++) {
        const time = raw[i][0]; // time interval (e.g., 08:00–08:50)
        for (let j = 1; j < raw[i].length; j++) {
            const slotCell = raw[i][j];
            const day = days[j - 1];

            if (slotCell && typeof slotCell === "string") {
                slotCell.split('+').forEach(slot => {
                    const cleanSlot = slot.trim();
                    if (cleanSlot) {
                        map[cleanSlot] = `${day} ${time}`;
                    }
                });
            }
        }
    }

    return map;
}

// Export as timetable.json — from parsed map directly
function exportSlotTimetableJSON() {
    const raw = localStorage.getItem('timetableGridRaw'); // stored after upload
    if (!raw) {
        alert("❗ No timetable loaded. Please upload the Excel file first.");
        return;
    }

    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.json";
    a.click();
    URL.revokeObjectURL(url);
}

let slotTimeMap = {};

// Generate slotTimeMap from timetable.json
function generateSlotTimeMap() {
    fetch('../assets/timetable.json')
        .then(res => res.json())
        .then(data => {
            const slotMap = {};

            for (let rowIndex = 3; rowIndex < data.length; rowIndex += 2) {
                const dayRow = data[rowIndex];
                const labRow = data[rowIndex + 1];

                const day = dayRow[0];
                const theoryTimes = data[1];
                const labTimes = data[2];

                for (let i = 2; i < dayRow.length; i++) {
                    const theoryCell = (dayRow[i] || "").trim();
                    const labCell = (labRow[i] || "").trim();

                    // Theory
                    if (theoryCell) {
                        const slots = theoryCell.split('/').map(s => s.trim()).filter(Boolean);
                        for (const slot of slots) {
                            if (!slotMap[slot]) slotMap[slot] = [];
                            slotMap[slot].push({
                                day,
                                start: theoryTimes[i]?.split('-')[0]?.trim() || "",
                                end: theoryTimes[i]?.split('-')[1]?.trim() || ""
                            });
                        }
                    }

                    // Lab
                    if (labCell) {
                        const slots = labCell.split('/').map(s => s.trim()).filter(Boolean);
                        for (const slot of slots) {
                            if (!slotMap[slot]) slotMap[slot] = [];
                            slotMap[slot].push({
                                day,
                                start: labTimes[i]?.split('-')[0]?.trim() || "",
                                end: labTimes[i]?.split('-')[1]?.trim() || ""
                            });
                        }
                    }
                }
            }

            slotTimeMap = slotMap;
            alert("✅ slotTimeMap generated successfully!");
        })
        .catch(err => {
            console.error("❌ Failed to load timetable.json:", err);
            alert("❌ Error loading timetable.json. Please upload it first.");
        });
}

// Download as slotTimeMap.js
function downloadSlotTimeMap() {
    if (!slotTimeMap || Object.keys(slotTimeMap).length === 0) {
        alert("Please generate the slotTimeMap first.");
        return;
    }

    const content = "export const slotTimeMap = " + JSON.stringify(slotTimeMap, null, 2) + ";";
    const blob = new Blob([content], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slotTimeMap.js";
    a.click();
    URL.revokeObjectURL(url);
}
