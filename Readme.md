# 🎓 Plan Ahead: Course Registration & Timetable Management System

A modern, fully client-side web application designed for **VIT-AP students and admins** to simplify course registration, prevent slot clashes, and visualize weekly timetables. Built using **HTML**, **Bootstrap 5**, **JavaScript**, and popular frontend libraries. No backend required — deploy anywhere and it just works.

> 💡 Inspired by real student struggles during registration week: slot confusion, timetable clashes, and lack of visual planning tools.

---

## 📂 Project Structure

course-registration/
├── index.html # Landing page
├── about.html # About the system and team
├── admin/
│ ├── login.html # Secure admin login
│ ├── adminDashboard.html # Admin course management dashboard
│ ├── admin.js # Admin-side logic (upload, parse, validate)
│ └── admin.css
├── student/
│ ├── studentDashboard.html # Student dashboard with live timetable
│ ├── student.js # Handles course selection & rendering
│ └── student.css
├── assets/
│ ├── courses.json # Course catalog (populated by admin)
│ ├── timetable.json # Slot-day-time mappings
│ └── slotTimeMap.js # Maps slot codes to time blocks
├── utils/
│ └── clashDetector.js # Detects slot and time clashes
├── js/
│ └── common.js # Shared UI behavior (navs, toggles)
├── css/
│ └── common.css # Global styling
│ └── index.css
├── animations/
│ └── register.json # Lottie Animation


---

## 👩‍💼 Admin Role

### 🔐 Secure Login
- Route: `/admin/login.html`
- Default Credentials:
  - **Username:** `admin`
  - **Password:** `**********`
- Future support for Firebase Auth or JWT planned.

### 📤 Upload & Manage Courses
- Upload via Excel or CSV:
  - `COURSE CODE`, `COURSE TITLE`, `COURSE TYPE`, `SLOT`
- Upload Slot Timetable:
  - `SLOT`, `DAY`, `START TIME`, `END TIME`

### ✍️ Manual Entry & Control
- Add courses using manual form.
- Instantly search, edit, or delete entries.
- Upload and preview timetable in grid format (supports PDF parsing).

---

## 👨‍🎓 Student Role

### 🧾 Visual Course Selection
- Route: `/student/dashboard.html`
- Browse course catalog and add desired courses.
- **Clash Detection** ensures no overlapping theory/lab sessions.
- Slot clashes handled both by **slot name** and actual **time overlap** (even for complex cases like `TC2/G2`).

### 🗓️ Timetable Visualization
- Real-time timetable grid updates based on selections.
- Slots are accurately rendered into cells based on `timetable.json`.

### 💾 Smart History
- LocalStorage-based auto-save.
- Keeps selection history for up to **7 days** — survives tab closes or refreshes.

### 📤 PDF Export
- Download:
  - 📘 Selected Courses
  - 📆 Weekly Timetable
  - 📋 Combined PDF
- Powered by `html2pdf.js` and `jsPDF`.

---

## ✨ Features at a Glance

| Feature                       | Description                                                                 |
|------------------------------|-----------------------------------------------------------------------------|
| ✅ Conflict-Free Registration | Real-time validation of slot and time clashes                              |
| 🧠 Timetable Preview          | See your entire academic week at a glance                                  |
| 📤 PDF Export                 | Download selected courses or timetable for offline viewing                 |
| 💾 Auto Save                 | Local history retained for 7 days                                          |
| 🛠️ Admin Tools               | Excel upload, live filtering, manual add/remove                            |
| 📱 Responsive Design          | Works beautifully on all screen sizes                                      |
| 🔐 No Login for Students      | Students jump right into planning                                          |

---

## 🧰 Technologies & Libraries Used

| Library        | Purpose                           |
|----------------|-----------------------------------|
| **Bootstrap 5**| Responsive UI framework           |
| **SheetJS**    | Read Excel/CSV for slot/course data|
| **jsPDF**      | Generate PDFs from HTML           |
| **html2pdf.js**| Render and download full page PDFs|
| **Vanilla JS** | Core logic for clash detection, data rendering |
| **localStorage**| Client-side session tracking      |

---

## 🧪 Sample Data Format

### 📘 `course-catalog-sample.xlsx`
| COURSE CODE | COURSE TITLE       | COURSE TYPE | SLOT       |
|-------------|--------------------|-------------|------------|
| CSE1013     | Formal Languages   | Theory      | A1+TA1     |
| CSE2001     | Data Structures    | Theory      | C1+TC1     |

### 📆 `slot-timetable-sample.xlsx`
| SLOT | DAY  | START TIME | END TIME |
|------|------|------------|----------|
| A1   | Mon  | 08:00      | 08:50    |
| B1   | Mon  | 09:00      | 09:50    |

---

## 🧱 Timetable Rendering Logic

- Slots like `L2+L3` (labs) and `A1+TA1` (theory) are handled using a **slotTimeMap**.
- Complex cells (e.g. `TC2/G2`) are parsed and visualized cleanly.
- Admin-provided `timetable.json` is the base for rendering grid.

---

## 🔮 Vision & Future Roadmap

- 📱 **Native Mobile App** (Flutter-based): For on-the-go access
- 📊 **Analytics for Admins**: Track course demand, preferred slots
- 🧠 **AI-based Suggestions**: Recommend best schedule based on preferences
- 🔔 **Real-Time Updates**: Push notifications for catalog or slot changes
- 🧾 **Semester Forecasting**: Add hypothetical future plans

---

## 🚀 Deployment

No setup needed.

🖥️ Just clone or download and open in any browser.

🌐 Easily deploy on:
- GitHub Pages
- Netlify (Drop folder)
- Vercel
- Firebase Hosting (optional for future backend)

> Works **offline** after the first load thanks to client-side storage.

---

## 👨‍💻 Author

Built with ❤️ by **Dudekula Mahammad Basha**,  
B.Tech Student, VIT-AP University  
Aiming to solve real-world campus issues with smart software.

- 🌐 [LinkedIn](https://www.linkedin.com/in/mahammadbasha1004/)
- 💻 [GitHub](https://github.com/Mahammad2004)

---

## 📜 License

MIT License — feel free to reuse and improve with credits.