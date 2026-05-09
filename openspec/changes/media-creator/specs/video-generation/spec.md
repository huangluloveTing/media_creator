## ADDED Requirements

### Requirement: Submit generation task

The system SHALL submit a Shot's configuration to Seedance Ark API for video generation.

#### Scenario: Generate a single shot

- **WHEN** user clicks "Generate" on a Shot with a valid prompt and saved configuration
- **THEN** the backend sends a POST request to Seedance Ark API with the combined prompt (global style + shot prompt + camera keywords), model parameters, and optional reference images, and returns a task ID

#### Scenario: Generate all shots

- **WHEN** user clicks "Generate All" from the toolbar
- **THEN** all Shot nodes with status `draft` are submitted to Seedance sequentially or with a configurable concurrency limit

#### Scenario: Prevent duplicate submission

- **WHEN** user tries to generate a Shot that is already in `queued` or `generating` status
- **THEN** the request is rejected with an error message

---

### Requirement: Poll generation status

The system SHALL poll Seedance API for task status updates and reflect them on the Shot node.

#### Scenario: Task progresses

- **WHEN** a generation task is in `running` status
- **THEN** the backend polls Seedance every 3 seconds and updates the `generation_tasks` row with the latest status and progress percentage

#### Scenario: Task succeeds

- **WHEN** Seedance returns status `succeeded`
- **THEN** the generation task status becomes `completed`, the video URL is stored, and the video file is automatically downloaded to local storage

#### Scenario: Task fails

- **WHEN** Seedance returns status `failed`
- **THEN** the generation task status becomes `failed`, the error message is stored, and the Shot node displays a failure indicator

#### Scenario: Frontend status display

- **WHEN** the frontend polls `GET /api/projects/:id/shots`
- **THEN** each Shot node on the canvas displays its current generation status with an icon (⏳ queued, 🔄 generating with progress %, ✅ completed, ❌ failed) and color coding

---

### Requirement: Download generated video

The system SHALL download the generated video from Seedance's temporary URL to local storage.

#### Scenario: Successful download

- **WHEN** a generation task completes and a video URL is available
- **THEN** the video is downloaded to `{output_dir}/{project_id}/shots/{shot_order}.mp4` and the local path is stored in the database

#### Scenario: Extract last frame

- **WHEN** a video is downloaded successfully
- **THEN** the last frame is extracted via FFmpeg and saved as `{output_dir}/{project_id}/shots/{shot_order}_lastframe.png` for potential use as the next shot's first-frame reference

---

### Requirement: Retry failed generation

The system SHALL allow retrying a failed generation task.

#### Scenario: Retry a failed shot

- **WHEN** user clicks "Retry" on a Shot with `failed` status
- **THEN** the status resets to `draft`, and the user can re-submit for generation

#### Scenario: Retry preserves configuration

- **WHEN** a shot is retried
- **THEN** the original prompt, camera, constraint, and generation parameters are preserved and editable before re-submission

---

### Requirement: Seedance API key configuration

The system SHALL load the Seedance API key from the server environment.

#### Scenario: Missing API key

- **WHEN** the server starts without `SEEDANCE_API_KEY` environment variable set
- **THEN** the server logs a warning and all generation requests return an error with message "Seedance API key not configured"
