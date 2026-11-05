# Blickwinkle Attendance Management System
**Subdomain:** `attendance.blickwinkle.com`  
**Powered by ZTOI TECH**

A production-ready mobile selfie camera and GPS-verified attendance management system for Blickwinkle staff and interns, paired with an administrative console.

---

## 🚀 Key Features

### 1. Staff & Intern Mobile Experience (Android & iPhone / iPad)
- **10-Digit Mobile Login**: Fast, secure mobile sign-in (`/login`).
- **Strict Device Gate**: Ensures access is from a mobile phone or tablet (`DeviceGate.tsx`).
- **Front Selfie Camera Only**: Live selfie camera preview fitted neatly into the attendance card strictly with `facingMode: "user"`. No flipping to rear camera allowed.
- **Strict GPS Location Verification**: Live device geolocation coordinates and accuracy required. Blocks attendance recording if phone GPS or browser location permission is off.
- **One-Tap Check-In & Check-Out**:
  - Automatically assesses punctuality against office start time and grace period.
  - Automatically calculates shift duration on check-out.
- **Two Mobile Pages**:
  - **Dashboard (`/`)**: Front camera capture, GPS live status, and Today's Activity card (matches design screenshot).
  - **Attendance History (`/history`)**: Date range filter (from date to to date, default 1st of month to today), summary metrics, and click to view selfie and location modal.
  - **Fixed Bottom Navigation**: Quick switching between Dashboard and Attendance.

### 2. Admin Portal (`attendance.blickwinkle.com/admin`)
- **System & Mobile Responsive**: Full dashboard with responsive sidebar and mobile drawer.
- **Live Overview Dashboard (`/admin/dashboard`)**:
  - Total Active, Checked In Today, On-Time, Late, Absent, Attendance Rate %, and Average Shift duration.
  - Real-time feed of today's check-ins with selfie photos.
- **Staff & Intern Management (`/admin/staff`)**:
  - View, add, update, and delete staff/intern members.
  - Full Name*, 10-digit Phone*, Address, Aadhaar Number (12–16 digits), Role (Staff/Intern), Status (Active/Inactive).
  - Direct 1-click link to view individual attendance logs.
- **Split-Screen Attendance Viewer (`/admin/attendance`)**:
  - **Left Half**: List of days and member records with search, date picker, status pills, and thumbnail avatars.
  - **Right Half**: Detailed inspection pane with both Check-In & Check-Out times, full selfie images (with zoom modal), GPS coordinates, full address, and a direct **Google Maps pin link**.
- **Complete Analytics & Payroll Export (`/admin/analytics`)**:
  - Performance leaderboard, punctuality scores, cumulative hours worked.
  - Daily volume breakdown.
  - **"Export Report (CSV)"** button for payroll / HR spreadsheets.
- **Office Settings (`/admin/settings`)**:
  - Company/Office Name.
  - Work start time (default `09:30`) and end time (default `18:30`).
  - Late grace threshold (default `30` mins).
  - Strict geofence toggle, latitude, longitude, and radius in meters.
  - Administrator password update form.

---

## 🗄️ Database Schema (`le_test`)
All tables use the strict `blickwinkle_attendance_` prefix:
- `blickwinkle_attendance_admins`: Administrative accounts.
- `blickwinkle_attendance_staffs`: Registered staff and interns (clean production state: 0 sample rows).
- `blickwinkle_attendance_records`: Daily attendance records (clean production state: 0 sample rows).
- `blickwinkle_attendance_settings`: Office configuration key-value store.

---

## 📸 PHP Image Backend (`ztoitech.com/blickwinkle/attendance`)
Located in `attendance/php-backend/`:
1. `upload.php`: Accepts base64 or multipart selfies, validates MIME types, saves to `uploads/`, and returns public URL.
2. `get_image.php`: Securely serves and streams saved selfies.
3. `.htaccess` & `uploads/.htaccess`: CORS configuration, upload size limits, and security protections (forbids script execution inside uploads).
4. `index.php`: Health check endpoint.

### Deploying the PHP Backend to cPanel:
1. Open cPanel File Manager and navigate to `public_html/blickwinkle/attendance/`.
2. Upload the contents of `attendance/php-backend/`.
3. Ensure the `uploads/` folder has writable permissions (`0755` or `0777`).

---

## 🌐 Vercel Deployment (`attendance.blickwinkle.com`)
1. In Vercel, import your repository.
2. Set the **Root Directory** to `attendance`.
3. Add the environment variables:
   - `DB_HOST`: `192.169.147.255`
   - `DB_PORT`: `3306`
   - `DB_USER`: `MEAZHA`
   - `DB_PASS`: `dZYRYi(o(0*U`
   - `DB_NAME`: `le_test`
   - `JWT_SECRET`: `blickwinkle_attendance_super_secret_jwt_key_2026_ztoitech`
   - `NEXT_PUBLIC_IMAGE_API_URL`: `https://ztoitech.com/blickwinkle/attendance/upload.php`
4. Add custom domain: `attendance.blickwinkle.com`.

---

## 🔐 Initial Admin Credentials
- **URL**: `https://attendance.blickwinkle.com/admin/login`
- **Username**: `admin`
- **Password**: `admin`
*(You can change the password anytime in Office Settings → Change Administrator Password)*
