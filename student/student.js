// student/js/student.js

let catalog = [];
let selected = [];
let timetable = {};
let currentPage = 1;
const itemsPerPage = 10;
let hasEditedRestoredPlan = false;

// Load JSON data on page load
async function initStudentDashboard() {
    try {
        catalog = await loadJSON('../assets/courses.json');
        const gridData = await loadJSON('../assets/timetable.json');
        renderTimetableFromGrid(gridData);
        window.renderTimetable = function () {
            loadJSON('../assets/timetable.json')
                .then(renderTimetableFromGrid)
                .catch(err => console.error("Failed to render timetable:", err));
        };

        renderCatalog();
        renderSelected();
        renderHistory();
        handleEvents();
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('typeFilter').addEventListener('change', renderCatalog);

// Render Course Catalog Table
function renderCatalog() {
    const q = document.getElementById('searchCourse').value.toLowerCase();
    const filter = document.getElementById('typeFilter').value;

    const tbody = document.getElementById('catalogTableBody');
    tbody.innerHTML = '';

    const renderedSet = new Set();

    // Filtered list
    const filteredCourses = catalog.filter(course => {
        const typeMap = {
            'TH': 'theory', 'ETH': 'theory',
            'ELA': 'lab', 'LO': 'lab', 'PJT': 'project'
        };
        const normalizedType = typeMap[course.type] || course.type.toLowerCase();
        if (filter && normalizedType !== filter) return false;

        return (
            course.code.toLowerCase().includes(q) ||
            course.title.toLowerCase().includes(q) ||
            course.slot.toLowerCase().includes(q)
        );
    });

    // Total pages
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

    paginated.forEach(course => {
        const uniqueKey = `${course.code}_${course.slot}`;
        if (renderedSet.has(uniqueKey)) return;
        renderedSet.add(uniqueKey);

        const isTheory = ['TH', 'ETH'].includes(course.type);
        const isLab = ['ELA', 'LO'].includes(course.type);
        const isProject = ['PJT'].includes(course.type);

        const isAlreadySelected = selected.some(s =>
            s.code === course.code &&
            (
                (isTheory && ['TH', 'ETH'].includes(s.type)) ||
                (isLab && ['ELA', 'LO'].includes(s.type)) ||
                (isProject && ['PJT'].includes(s.type))
            )
        );

        const disabled = isAlreadySelected;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.title}</td>
            <td>${course.type}</td>
            <td>${course.slot}</td>
            <td>${course.credits}</td>
            <td>
                <button class="btn btn-sm btn-${disabled ? 'secondary' : 'success'}"
                    ${disabled ? 'disabled' : ''}
                    onclick="addCourse('${course.code}', '${course.slot}')">Add</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const createBtn = (label, disabled, onClick) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary btn-sm';
        btn.textContent = label;
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    };

    pagination.appendChild(createBtn('« First', currentPage === 1, () => {
        currentPage = 1;
        renderCatalog();
    }));

    pagination.appendChild(createBtn('‹ Prev', currentPage === 1, () => {
        currentPage--;
        renderCatalog();
    }));

    const pageLimit = 5;
    let start = Math.max(1, currentPage - Math.floor(pageLimit / 2));
    let end = Math.min(totalPages, start + pageLimit - 1);

    if (end - start < pageLimit - 1) {
        start = Math.max(1, end - pageLimit + 1);
    }

    for (let i = start; i <= end; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            renderCatalog();
        };
        pagination.appendChild(pageBtn);
    }

    pagination.appendChild(createBtn('Next ›', currentPage === totalPages, () => {
        currentPage++;
        renderCatalog();
    }));

    pagination.appendChild(createBtn('Last »', currentPage === totalPages, () => {
        currentPage = totalPages;
        renderCatalog();
    }));
}

document.getElementById('typeFilter').addEventListener('change', () => {
    currentPage = 1;
    renderCatalog();
});
document.getElementById('searchCourse').addEventListener('input', () => {
    currentPage = 1;
    renderCatalog();
});

// Render Selected Courses Table
function renderSelected() {
    const tbody = document.getElementById('selectedTableBody');
    tbody.innerHTML = '';

    if (selected.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td colspan="6" class="text-center text-muted fw-semibold py-3">
            No courses selected...
        </td>
    `;
        tbody.appendChild(tr);
        return; // Stop rendering further
    }

    const theoryMap = {};
    const labs = [];

    // Separate theory and lab courses
    selected.forEach(course => {
        const isLab = /L|ELA|LO/.test(course.type);

        if (isLab) {
            labs.push(course);
        } else {
            theoryMap[course.code] = {
                course,
                labs: []
            };
        }
    });

    // Group lab courses under their parent theory course if any
    labs.forEach(labCourse => {
        const theoryKey = Object.keys(theoryMap).find(code => labCourse.code === code);
        if (theoryKey) {
            theoryMap[theoryKey].labs.push(labCourse);
        } else {
            // Unmatched lab goes to end
            theoryMap[`__UNMATCHED_LAB__${labCourse.slot}`] = {
                course: null,
                labs: [labCourse]
            };
        }
    });

    // Define slot order function
    const slotOrder = [
        'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'F1', 'F2', 'G1', 'G2',
        'TA1', 'TA2', 'TB1', 'TB2', 'TC1', 'TC2', 'TD1', 'TD2', 'TE1', 'TE2', 'TF1', 'TF2', 'TG1', 'TG2',
        'TAA1', 'TAA2', 'TBB1', 'TBB2', 'TEA1', 'TEA2', 'TEB1', 'TEB2',
        'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16',
        'L17', 'L18', 'L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L25', 'L26', 'L27', 'L28', 'L29', 'L30',
        'L31', 'L32', 'L33', 'L34', 'L35', 'L36', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42', 'L43', 'L44',
        'L45', 'L46', 'L47', 'L48', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60'
    ];
    const getSlotRank = slot => {
        const subSlots = slot.split(/[+/]/).map(s => s.trim());
        for (const s of subSlots) {
            const idx = slotOrder.indexOf(s);
            if (idx !== -1) return idx;
        }
        return slotOrder.length + 1;
    };

    // Sort theory courses by slot
    const sortedKeys = Object.keys(theoryMap).sort((a, b) => {
        const aSlot = theoryMap[a].course ? getSlotRank(theoryMap[a].course.slot) : getSlotRank(theoryMap[a].labs[0].slot);
        const bSlot = theoryMap[b].course ? getSlotRank(theoryMap[b].course.slot) : getSlotRank(theoryMap[b].labs[0].slot);
        return aSlot - bSlot;
    });

    // Render rows
    sortedKeys.forEach(key => {
        const item = theoryMap[key];

        if (item.course) {
            tbody.appendChild(createCourseRow(item.course));
        }
        item.labs.forEach(lab => {
            tbody.appendChild(createCourseRow(lab));
        });
    });

    function createCourseRow(course) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.title}</td>
            <td>${course.type}</td>
            <td>${course.slot}</td>
            <td>${course.credits}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeCourse('${course.code}', '${course.slot}')">Remove</button>
            </td>
        `;
        return tr;
    }
}

function confirmRemoveAll() {
    selected = [];
    renderSelected();
    renderCatalog();
    renderTimetable();
    bootstrap.Modal.getInstance(document.getElementById('clashModal')).hide();
}

function showRemoveAllModal() {
    if (selected.length === 0) {
        showToast("No courses selected to remove.", "warning");
        return;
    }

    const clashModalBody = document.getElementById('clashModalBody');
    const clashModalFooter = document.querySelector('#clashModal .modal-footer');
    const clashModalIcon = document.querySelector('#clashModal .modal-header svg');

    // Change icon to warning triangle for remove all
    clashModalIcon.outerHTML = `
        <div class="fade-in-x d-flex justify-content-center align-items-center modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="#ffc107"
                 class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.091 
                         1.767.982 1.767h13.707c.89 0 1.438-.99.982-1.767L8.982 
                         1.566zM8 5c.535 0 .954.462.9.995l-.35 
                         3.507a.552.552 0 0 1-1.1 0L7.1 
                         5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 
                         1-2.002 0 1 1 0 0 1 2.002 0z"/>
            </svg>
        </div>
    `;

    clashModalBody.innerHTML = `
        <div class="text-center">Are you sure you want to remove <strong>all selected courses?</strong></div>
    `;

    clashModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-danger" onclick="confirmRemoveAll()">Yes, Remove All</button>
    `;

    const clashEl = document.getElementById('clashModal');
    const clashModal = new bootstrap.Modal(clashEl);
    clashModal.show();
}

// Timetable Grid Rendering
function renderTimetableFromGrid(gridData) {
    const container = document.getElementById("timetable");
    container.innerHTML = "";

    const usedSlots = {};

    // Map each individual slot (like B1, TB1, TBB1) to course codes
    selected.forEach(course => {
        const slots = ClashDetector.extractSlots(course.slot); // returns array of slot strings
        slots.forEach(slot => {
            if (!usedSlots[slot]) usedSlots[slot] = [];
            usedSlots[slot].push(course.code);
        });
    });

    const maxCols = Math.max(...gridData.map(row => row.length));

    const table = document.createElement("table");
    table.className = "table table-bordered table-sm text-center align-middle timetable-table";

    gridData.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        // Heading row like "ANNEXURE - I"
        if (rowIndex === 0 && row.length === 1) {
            const th = document.createElement("th");
            th.colSpan = maxCols;
            th.className = "timetable-heading";
            th.textContent = row[0];
            tr.appendChild(th);
            table.appendChild(tr);
            return;
        }

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            const cell = row[colIndex];
            const isHeader = rowIndex <= 2 || colIndex <= 1;
            const el = document.createElement(isHeader ? "th" : "td");

            el.classList.add("timetable-cell");

            const slotText = typeof cell === 'string' ? cell.trim() : "";
            if (!isHeader) {
                if (slotText) {
                    const subSlots = slotText.split('/').map(s => s.trim()).filter(Boolean);
                    let matchingCourses = [];
                    let cellType = null;

                    for (const subSlot of subSlots) {
                        if (usedSlots[subSlot]) {
                            // Identify type just once, based on first match
                            if (!cellType) {
                                cellType = /^L|LB|LAB/i.test(subSlot) ? 'lab' : 'theory';
                            }

                            matchingCourses.push(
                                `<div style="display: flex; flex-direction: column; align-items: center;">
                                <div class="slot-label small">${subSlot}</div>
                                <div class="course-code">${usedSlots[subSlot].join('<hr class="my-1" />')}</div>
                                </div>`
                            );
                        }
                    }

                    if (matchingCourses.length > 0) {
                        el.innerHTML = matchingCourses.join('<hr class="my-1" />');
                        el.classList.add("timetable-active", cellType);

                        // Apply full-cell color based on first matching sub-slot type
                        if (cellType === 'theory') {
                            el.style.backgroundColor = "#e0f0ff"; // Light blue for theory
                        } else if (cellType === 'lab') {
                            el.style.backgroundColor = "#e3fcec"; // Light green for lab
                        }
                    } else {
                        el.textContent = slotText;
                        el.classList.add("timetable-empty");
                    }
                } else {
                    el.textContent = "";
                    el.classList.add("timetable-empty");
                }
            } else {
                el.textContent = slotText || "";
                el.classList.add("timetable-header");
            }

            tr.appendChild(el);
        }

        table.appendChild(tr);
    });

    container.appendChild(table);
}

function getCourseTypeFullForm(short) {
    const map = {
        "TH": "Theory",
        "ELA": "Lab",
        "LO": "Lab",
        "PJT": "Project",
        "ETH": "Theory"
    };
    return map[short.toUpperCase()] || short;
}

// Add course to selected list
function addCourse(code, slot) {
    const course = catalog.find(c => c.code === code && c.slot === slot);
    if (!course) return;

    if (selected.some(c => c.code === code && c.slot === slot)) return;
    const clashing = ClashDetector.getClashingCourses(selected, course);
    if (clashing.length) {
        const typeFull = {
            'TH': 'Theory',
            'ETH': 'Theory',
            'ELA': 'Lab',
            'LO': 'Lab',
            'Theory': 'Theory',
            'Lab': 'Lab',
            'PJT': 'Project',
            'Project': 'Project'
        };

        const newType = typeFull[course.type] || course.type;

        const clashCourse = selected.find(s => s.code === clashing[0]);
        const clashType = typeFull[clashCourse.type] || clashCourse.type;

        const clashMessage = `<strong>${course.code} ${newType} slot</strong> clashed with <strong>${clashType} slot</strong> of <strong>${clashCourse.code}</strong>`;
        const clashModal = document.getElementById('clashModal');

        // Reset the icon (if needed, optional)
        // If other modals change the header SVG, you may want to restore it:
        const clashModalHeader = clashModal.querySelector('.modal-header');
        clashModalHeader.innerHTML = `
    <div class="fade-in-x text-danger modal-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="currentColor"
            class="bi bi-x-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 
            .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 
            .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>
    </div>
`;

        // Update only the body with the clash message
        document.getElementById('clashModalBody').innerHTML = `
    <div class="text-center">${clashMessage}</div>
`;

        // Reset footer to default Okay button
        const clashModalFooter = clashModal.querySelector('.modal-footer');
        clashModalFooter.innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Okay</button>
`;

        // Show the modal
        const modalInstance = new bootstrap.Modal(clashModal);
        modalInstance.show();
        return;
    }

    selected.push(course);
    hasEditedRestoredPlan = true;
    renderSelected();
    renderCatalog();
    renderTimetable();
}

document.getElementById('clashModal')?.addEventListener('hidden.bs.modal', () => {
    // Focus on a safe element
    document.getElementById('mainHeading')?.focus();
});

// Remove course from selected
function removeCourse(code, slot) {
    selected = selected.filter(c => !(c.code === code && c.slot === slot));
    hasEditedRestoredPlan = true;
    renderSelected();
    renderCatalog();
    window.renderTimetable();
}

async function exportPDF(type) {
    if (!selected || selected.length === 0) {
        showToast("Please select at least one course/slot to downlaod plan.", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    let y = margin;

    // --- TITLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text("Course Registration Plan", pageWidth / 2, y, { align: 'center' });
    y += 50;

    // --- SELECTED COURSES ---
    if (type === 'courses' || type === 'combined') {
        const selectedRows = [];
        const table = document.getElementById('selectedTableBody');
        table.querySelectorAll('tr').forEach(tr => {
            const row = Array.from(tr.querySelectorAll('td')).slice(0, 5).map(td => td.innerText.trim());
            selectedRows.push(row);
        });

        if (selectedRows.length) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Courses Choosed", margin, y);
            y += 10;

            doc.autoTable({
                startY: y,
                head: [['Course Code', 'Course Title', 'Course Type', 'Slot', 'Credits']],
                body: selectedRows,
                margin: { left: margin },
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 6 },
                headStyles: { fillColor: [41, 128, 185], halign: 'center' }
            });

            y = doc.lastAutoTable.finalY + 80; // extra spacing at end
        }
    }

    // --- TIMETABLE IMAGE ON SEPARATE PAGE ---
    if (type === 'timetable' || type === 'combined') {
        doc.addPage();
        const timetable = document.getElementById('timetable');
        if (timetable) {
            const clone = timetable.cloneNode(true);
            clone.style.border = "1px solid #ccc";
            clone.style.padding = "5px";
            clone.style.background = "white";
            clone.style.color = "black";

            const wrapper = document.createElement('div');
            wrapper.style.padding = "5px";
            wrapper.style.background = "white";
            wrapper.style.display = "inline-block";
            wrapper.appendChild(clone);

            document.body.appendChild(wrapper);
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true });
            document.body.removeChild(wrapper);

            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);

            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            const x = margin;
            const headingY = 100;
            const imageY = headingY + 10;

            // Draw heading above image
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Time Table", margin, headingY); // Left aligned
            doc.addImage(imgData, 'PNG', x, imageY, imgWidth, imgHeight);
        }
    }

    // --- Footer Page Numbers ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
        doc.setTextColor(0); // reset color
    }

    // --- Save File ---
    doc.save(`Plan_export.pdf`);
}

let restoredPlanIndex = null;

function saveAsNewPlan() {
    const timestamp = new Date().toLocaleString();
    const data = { timestamp, selected };
    const all = loadFromLocal('courseHistory') || [];

    all.push(data); // always append to end
    saveToLocal('courseHistory', all);

    showToast('Saved as new plan!', 'success');
    resetPlanStateAfterSave(); // ✅ Clear after save
    setTimeout(renderHistory, 50);
}

function overwriteExistingPlan() {
    const timestamp = new Date().toLocaleString();
    const data = { timestamp, selected };
    const all = loadFromLocal('courseHistory') || [];

    if (restoredPlanIndex !== null && all[restoredPlanIndex]) {
        all[restoredPlanIndex] = data;
        saveToLocal('courseHistory', all);
        showToast(`Plan ${String.fromCharCode(65 + restoredPlanIndex)} updated!`, 'success');
        resetPlanStateAfterSave(); // ✅ Clear after save
        setTimeout(renderHistory, 50);
    }
}


function resetPlanStateAfterSave() {
    restoredPlanIndex = null;
    hasEditedRestoredPlan = false;
}

function showSavePlanModal() {
    const clashModal = document.getElementById('clashModal');
    const clashModalBody = document.getElementById('clashModalBody');
    const clashModalFooter = clashModal.querySelector('.modal-footer');
    const clashModalHeader = clashModal.querySelector('.modal-header');

    // Replace header with icon and close button
    clashModalHeader.innerHTML = `
        <div class="fade-in-x d-flex justify-content-center align-items-center w-100 position-relative modal-icon">
            <div class="mx-auto" id="clashModalIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="#ffc107"
                    class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.091 
                            1.767.982 1.767h13.707c.89 0 1.438-.99.982-1.767L8.982 
                            1.566zM8 5c.535 0 .954.462.9.995l-.35 
                            3.507a.552.552 0 0 1-1.1 0L7.1 
                            5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 
                            1-2.002 0 1 1 0 0 1 2.002 0z"/>
                </svg>
            </div>
        </div>
    `;

    // Body content
    clashModalBody.innerHTML = `
        <div class="text-center">
            You have modified an existing plan.<br>
            Do you want to <strong>overwrite</strong> it or <strong>save as a new</strong> one?
        </div>
    `;

    // Footer buttons (no inline onclick)
    clashModalFooter.innerHTML = `
        <button type="button" id="overwritePlanBtn" class="btn btn-info text-white">Overwrite</button>
        <button type="button" id="newPlanBtn" class="btn btn-primary">New</button>
    `;

    const modalInstance = new bootstrap.Modal(clashModal);

    // Attach event listeners safely
    document.getElementById('overwritePlanBtn').onclick = () => {
        overwriteExistingPlan();
        modalInstance.hide();
    };

    document.getElementById('newPlanBtn').onclick = () => {
        saveAsNewPlan();
        modalInstance.hide();
    };

    modalInstance.show();
}


// Save selection to localStorage
function saveHistory() {
    if (!selected || selected.length === 0) {
        showToast('No courses selected to save.', 'warning');
        return;
    }

    if (restoredPlanIndex !== null && hasEditedRestoredPlan) {
        showSavePlanModal();
        return;
    }

    saveAsNewPlan(); // default save
}


// Render lasts 30-day history
function renderHistory() {
    const list = document.getElementById('historyList');
    const all = loadFromLocal('courseHistory') || [];

    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Filter out entries older than 30 days
    const filtered = all.filter(entry => {
        const age = now - new Date(entry.timestamp).getTime();
        return age < THIRTY_DAYS;
    });

    // If some entries were removed, update localStorage
    if (filtered.length !== all.length) {
        saveToLocal('courseHistory', filtered);
    }

    // Render updated list
    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted fw-semibold py-3">
                    No slot plan saved till now. Save a new one now!!
                </td>
            </tr>
        `;
        return;
    }
    filtered.forEach((h, i) => {
        const planName = `Plan ${String.fromCharCode(65 + i)}`; // Plan A, B, ...
        const formattedDate = new Date(h.timestamp).toLocaleString();

        list.innerHTML += `
            <tr>
                <td>${planName}</td>
                <td>${formattedDate}</td>
                <td class="history-actions">
                    <button class="btn btn-sm btn-primary me-2" onclick="restoreHistory(${i})">Restore</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHistory(${i})">Delete</button>
                </td>
            </tr>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const savedPlansTab = document.querySelector('a[href="#savedPlans"]');

    if (savedPlansTab) {
        savedPlansTab.addEventListener('shown.bs.tab', function (event) {
            renderHistory(); // Call your reload function here
        });
    }
});

function restoreHistory(index) {
    const all = loadFromLocal('courseHistory') || [];
    const entry = all[index];
    if (!entry) return;

    selected = JSON.parse(JSON.stringify(entry.selected)); // deep copy
    restoredPlanIndex = index;
    hasEditedRestoredPlan = false;
    renderSelected();
    renderCatalog();
    renderTimetable();
    showToast(`Restored Plan ${String.fromCharCode(65 + index)}`, 'info');
}

function deleteHistory(i) {
    const all = loadFromLocal('courseHistory') || [];
    all.splice(i, 1);
    saveToLocal('courseHistory', all);
    renderHistory();
}

// Event Listeners
function handleEvents() {
    document.getElementById('searchCourse').addEventListener('input', renderCatalog);

    window.renderTimetable = renderTimetable;
    window.exportPDF = exportPDF;
    window.saveHistory = saveHistory;
    window.restoreHistory = restoreHistory;
    window.deleteHistory = deleteHistory;
    window.addCourse = addCourse;
    window.removeCourse = removeCourse;
}

// Init
window.onload = initStudentDashboard;