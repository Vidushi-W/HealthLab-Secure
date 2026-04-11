# Guide: Creating an Experiment in HealthLab

As a researcher, you can create and manage experiments to collect data from participants.

## 1. Accessing the Experiment Manager
- Ensure you are logged in with a **Researcher** account.
- Click on **My Experiments** in the navigation bar.
- Direct link: [http://localhost:5173/researcher/experiments](http://localhost:5173/researcher/experiments)

## 2. Creating a New Experiment
Click the **+ New Experiment** button in the hero section. This will open the creation modal.

### Basic Information
| Field | Description |
| :--- | :--- |
| **Title** | The name of your experiment (e.g., "Daily Hydration & Mental Clarity"). |
| **Description** | A detailed explanation of the study goals and requirements. |
| **Status** | **Draft**: Visible only to you. **Published**: Visible to participants. **Closed**: Recruitment finished. |
| **Participant Limit** | Maximum number of people who can join (0 for unlimited). |

### Dates & Timeline
- **Start Date**: When the data collection phase begins.
- **End Date**: When the experiment finishes.
- **Application Deadline**: The last date participants can apply to join.

### Conflict Tags
Use comma-separated tags (e.g., `cardio, diet`) to prevent participants from joining multiple conflicting studies at the same time.

---

## 3. Defining Participant Logs (Data Collection)
This is the most important part. You define exactly what data participants will submit in their daily logs.

For each field, you can specify:
- **Label**: What the participant sees (e.g., "Hours Slept").
- **Type**:
  - `number`: For measurements (steps, weight, etc.).
  - `text`: For qualitative notes.
  - `boolean`: Yes/No questions.
  - `date`/`time`: Specific timestamps.
  - `select`/`multi-select`: Pick from a list of options (comma-separated).
- **Unit**: (Optional) e.g., `kg`, `hours`, `mg`.
- **Required**: Check this if the participant *must* fill this field every day.

---

## 4. Managing Your Experiment
Once created, your experiment will appear in the table where you can:
- **View**: See all details and the AI-generated summary.
- **Edit**: Update details (allowed in Draft mode).
- **Delete**: Permanently remove the experiment.
- **AI Summary**: Once you have participant logs, click **Generate AI Summary** in the View modal to get a Gemini-powered analysis of the experiment's progress.
