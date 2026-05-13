## ADDED Requirements

### Requirement: SSE endpoint for generation progress
The system SHALL provide a Server-Sent Events endpoint that pushes task status updates to the frontend in real time.

#### Scenario: Client connects to SSE stream
- **WHEN** a client opens `GET /api/projects/:id/generation-stream`
- **THEN** the server SHALL return `Content-Type: text/event-stream` with appropriate SSE headers
- **THEN** the server SHALL immediately send the current status of all generation tasks for that project

#### Scenario: Progress update pushed on task change
- **WHEN** a worker updates a task's status/progress in the DB
- **THEN** the worker SHALL emit a `task-updated` event with `{ shotId, status, progress, errorMessage }`
- **THEN** the SSE stream SHALL push this event to all connected clients for the associated project

#### Scenario: Client disconnects gracefully
- **WHEN** a client closes the SSE connection
- **THEN** the server SHALL clean up the event listener for that client
- **THEN** no further events SHALL be sent to that client

### Requirement: Frontend SSE hook replaces polling
The frontend SHALL use an SSE-based hook to receive generation updates in real time.

#### Scenario: Hook connects on project load
- **WHEN** the project editor page loads
- **THEN** the hook SHALL open an SSE connection to `/api/projects/:id/generation-stream`
- **THEN** the hook SHALL dispatch generation updates to ProjectContext on each `task-updated` event

#### Scenario: Display generation progress
- **WHEN** a `task-updated` event is received with `status='queued'` or `status='generating'`
- **THEN** the frontend SHALL update the shot's generation status and progress

#### Scenario: Display generation completion
- **WHEN** a `task-updated` event is received with `status='completed'`
- **THEN** the frontend SHALL update the shot's status to `completed` and show the video preview

#### Scenario: Display generation failure with error
- **WHEN** a `task-updated` event is received with `status='failed'`
- **THEN** the frontend SHALL update the shot's status and SHALL display `errorMessage` to the user

#### Scenario: SSE reconnection on connection loss
- **WHEN** the SSE connection drops
- **THEN** the hook SHALL automatically reconnect
- **THEN** after reconnection, the hook SHALL fetch `GET /api/projects/:id/full` to get the complete current state
