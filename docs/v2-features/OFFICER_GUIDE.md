# 🎖️ NSTP Officer & Instructor Field Manual

Welcome to the **LAMBO Officer Command Portal**. This manual guides NSTP coordinators, university forestry instructors, and field supervisors on monitoring cadet participation, inspecting wildling health, and exporting academic compliance records.

---

## 🔑 1. Gaining Officer Access

1. **Enrollment with Officer Passcode**:
   - Navigate to the **Register** page (`/register`).
   - Fill in your Name, ID/Roll Number, Academic Department, and Password.
   - Expand the **"Officer / Staff Passcode"** field and enter the designated departmental security key (default: `NSTP2025` or configured via `OFFICER_SIGNUP_KEY`).
   - Upon registration, your profile will immediately receive the **🎖️ NSTP OFFICER** rank.

2. **Accessing the Command Portal**:
   - Click your profile avatar in the top-right header to open the quick-action drawer.
   - Look for the golden **"🎖️ NSTP OFFICER"** rank insignia below your name.
   - Click **"Officer Command Portal"** to navigate directly to the administrative dashboard (`/officer/dashboard`).

---

## 📊 2. The Compliance & Inspection Roster

The central view of the Officer Portal is the **Cadet Roster**, which aggregates live field telemetry across all enrolled students.

### Compliance Status Tiers:
- 🟢 **Compliant / Active**: The cadet has recorded at least one verified growth observation with photo in the last 7 days.
- 🟡 **Observation Overdue**: 8–14 days have elapsed since the cadet's last submitted observation.
- 🔴 **Delinquent**: Over 14 days without an observation log. Automatic alert flagged for officer follow-up.

### Overview Metrics:
- **Total Registered Wildlings**: Complete count of campus specimens under cadet management.
- **Active Cadets**: Percentage of students maintaining regular weekly observation schedules.
- **Specimen Survival Rate**: Proportion of trees classified as `Thriving` or `Stable / Fair` versus `Dead / Mortality`.

---

## 🔍 3. Inspecting Cadet Submissions

1. In the Cadet Roster table, click on any cadet's row or the **"Inspect Specimen"** button.
2. The **Cadet Inspection Drawer** opens displaying:
   - All specimens registered under that cadet's account.
   - The interactive growth curve tracking height and stem diameter progression.
   - **Photo Audit Feed**: High-resolution gallery of every observation photograph submitted by the cadet, complete with timestamps and camera metadata.
3. Verify that the photo shows the physical QR tag attached to the wildling and represents legitimate campus growth.

---

## 📥 4. Exporting Cohort Records for NSTP Grading

Officers can export comprehensive class records directly to Microsoft Excel (`.xlsx`):

1. From the Officer Command Portal, click the **"Export Grading Roster (.xlsx)"** button in the top action bar.
2. LAMBO generates a multi-column spreadsheet formatted specifically for academic grading:
   - `Cadet Name`
   - `Student / Roll Number`
   - `Academic Course / Program`
   - `Contact Phone Number`
   - `Assigned Specimen ID (e.g. LMB-0012)`
   - `Specimen Species & Common Name`
   - `Current Vitality (Thriving / Fair / Distressed / Dead)`
   - `Baseline Height vs Latest Height`
   - `Total Observations Recorded`
   - `Last Log Date`
   - `Compliance Standing (Satisfactory / Needs Attention / Incomplete)`

3. Save the `.xlsx` file for NSTP office archival or grade encoding.
