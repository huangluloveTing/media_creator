## ADDED Requirements

### Requirement: BullMQ queue for video generation
The system SHALL use BullMQ (backed by Redis) to manage video generation jobs.
BullMQ SHALL handle job queuing, deduplication, concurrency limit, retry with backoff, and job lifecycle.

#### Scenario: Job enqueued on generate request
- **WHEN** a client calls `POST /api/shots/:id/generate`
- **THEN** the system SHALL write `status='queued'` to `generation_tasks` table
- **THEN** the system SHALL add a BullMQ job with `name='generate-video'` and `data={ shotId }` to the `generation` queue
- **THEN** the job SHALL have `jobId = shotId` for deduplication

#### Scenario: Duplicate generate request is ignored
- **WHEN** a client calls `POST /api/shots/:id/generate` for a shot already in the queue with `status='queued'` or `status='generating'`
- **THEN** the system SHALL throw an error `Shot is already generating`
- **THEN** the system SHALL NOT enqueue a duplicate BullMQ job

#### Scenario: Worker processes job with concurrency limit
- **WHEN** a BullMQ job is picked up by a worker
- **THEN** the system SHALL call `submitToSeedance()` to submit the prompt
- **THEN** the system SHALL poll Seedance for result
- **THEN** the maximum concurrent jobs SHALL be limited to `concurrency: 3`

#### Scenario: Job retries on transient failure
- **WHEN** a Seedance submit or poll fails with a network error
- **THEN** BullMQ SHALL retry the job up to 3 total attempts
- **THEN** the retry SHALL use exponential backoff (5s, 25s, 125s)

#### Scenario: Job marked failed after max retries
- **WHEN** all 3 job attempts fail
- **THEN** the system SHALL update `generation_tasks` with `status='failed'` and the error message
- **THEN** the project status SHALL be recalculated

#### Scenario: Worker reports progress
- **WHEN** a worker receives a progress update from Seedance poll
- **THEN** the worker SHALL call `job.updateProgress(percentage)`
- **THEN** the worker SHALL update `generation_tasks` with the new progress value
- **THEN** the status SHALL be set to `'generating'` on first progress update

#### Scenario: Video download on successful generation
- **WHEN** Seedance returns `status='succeeded'` with a `videoUrl`
- **THEN** the system SHALL download the video to local disk
- **THEN** the system SHALL extract the last frame using ffmpeg
- **THEN** the system SHALL update `generation_tasks` with `status='completed'`, `localPath`, `lastFramePath`
- **THEN** the project status SHALL be recalculated

### Requirement: Queue status endpoint
The system SHALL expose a queue status endpoint for observability.

#### Scenario: Queue status returns job counts
- **WHEN** a client requests `GET /api/generation/queue`
- **THEN** the system SHALL return waiting/active/completed/failed/delayed job counts from BullMQ

### Requirement: De-queue orphan tasks at startup
When the server starts, the system SHALL not rely on BullMQ's automatic recovery (stalled jobs) for orphaned tasks.

#### Scenario: Stalled job recovery
- **WHEN** a worker crashes during job processing
- **WHEN** the `lockDuration` (5 minutes) expires
- **THEN** BullMQ SHALL automatically mark the job as stalled
- **THEN** BullMQ SHALL re-queue the job for another worker (up to `maxStalledCount` times)
- **THEN** the `generation_tasks` status SHALL remain `'generating'` until the job completes or fails on the next attempt
