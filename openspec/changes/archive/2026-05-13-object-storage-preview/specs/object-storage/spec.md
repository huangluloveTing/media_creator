## ADDED Requirements

### Requirement: MinIO object storage service
The system SHALL provide a MinIO-based object storage service for video files. All generated videos (shot clips and merged output) SHALL be stored in MinIO.

#### Scenario: Storage service creates bucket on init
- **WHEN** the application starts
- **THEN** the storage service SHALL check if the configured S3 bucket exists
- **THEN** if the bucket does not exist, the service SHALL create it
- **THEN** if bucket creation fails, the service SHALL log a warning but SHALL NOT crash

#### Scenario: Upload shot video to MinIO
- **WHEN** a Seedance video is downloaded successfully
- **THEN** the system SHALL upload the video file to MinIO with object key `projects/{projectId}/shots/{order}.mp4`
- **THEN** the temporary file SHALL be deleted after upload

#### Scenario: Upload merged video to MinIO
- **WHEN** the FFmpeg merge completes successfully
- **THEN** the system SHALL upload the merged video to MinIO with object key `projects/{projectId}/final.mp4`
- **THEN** the Project `finalVideoUrl` field SHALL be updated

#### Scenario: Get shot video presigned URL
- **WHEN** a client requests `GET /api/shots/:id/video`
- **THEN** the system SHALL return a presigned URL for the shot's video object (valid for 1 hour)
- **THEN** the response SHALL be `{ url: "https://..." }`

#### Scenario: Get merged video presigned URL
- **WHEN** a client requests `GET /api/projects/:id/final-video`
- **THEN** the system SHALL return a presigned URL for the merged video object
- **THEN** if the merged video does not exist, the system SHALL return 404

#### Scenario: Frontend plays video from presigned URL
- **WHEN** the frontend receives a presigned URL
- **THEN** a `<video>` tag SHALL use it as the `src` attribute
- **THEN** the browser SHALL play the video directly from MinIO
- **THEN** HTTP Range requests SHALL work (seek/progress bar)
