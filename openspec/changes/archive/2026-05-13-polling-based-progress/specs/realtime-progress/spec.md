## MODIFIED Requirements

### Requirement: Client polls for generation progress
The system SHALL use polling via `GET /api/projects/:id/full` to retrieve the latest generation status for all shots.

#### Scenario: Poll starts immediately on generate
- **WHEN** a client calls `POST /api/shots/:id/generate` and receives a queued task
- **THEN** the frontend SHALL start polling `GET /api/projects/:id/full` within 0ms (synchronously after dispatch)
- **THEN** the polling interval SHALL be 3000ms

#### Scenario: Poll updates individual shot progress
- **WHEN** the polling endpoint returns updated generation data for a shot
- **THEN** the frontend SHALL merge the generation status/progress/errorMessage into the existing state
- **THEN** the UI SHALL re-render with the latest values

#### Scenario: Poll stops when no active tasks
- **WHEN** all generation tasks have terminal status (`completed` or `failed`)
- **THEN** the frontend SHALL stop polling
- **THEN** no further requests to `GET /api/projects/:id/full` SHALL be made until new tasks are enqueued

## REMOVED Requirements

### Requirement: SSE endpoint for generation progress
**Reason**: Replaced by polling.
**Migration**: Use `GET /api/projects/:id/full` at 3s interval instead.

### Requirement: Frontend SSE hook replaces polling
**Reason**: Replaced by polling.
**Migration**: Use `usePollGenerationStatus` hook that calls `api.getProjectFull()` on interval.
