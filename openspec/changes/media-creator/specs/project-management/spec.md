## ADDED Requirements

### Requirement: Project CRUD

The system SHALL allow creating, reading, updating, and deleting video projects.

#### Scenario: Create a new project

- **WHEN** user creates a new project with a title
- **THEN** a project is created with default global settings (1920x1080, 24fps, dissolve transition, draft status) and a Start node and a Merge node are automatically created

#### Scenario: List all projects

- **WHEN** user requests the project list
- **THEN** all projects are returned ordered by last update time, each including title, status, and shot count

#### Scenario: Update project settings

- **WHEN** user modifies global settings (resolution, fps, default transition, output directory, global style prompt)
- **THEN** the project settings are updated and persisted

#### Scenario: Delete a project

- **WHEN** user deletes a project
- **THEN** the project and all associated shots, edges, and generation tasks are removed from the database, and all local video files for that project are deleted

---

### Requirement: Global settings via Start node

The system SHALL expose project-wide generation settings through the Start node properties panel.

#### Scenario: Edit Start node settings

- **WHEN** user selects the Start node on the canvas
- **THEN** the properties panel displays resolution, fps, default transition type/duration, output directory, and global style prompt fields, and changes are persisted immediately

#### Scenario: Start node is unique

- **WHEN** a project is created
- **THEN** exactly one Start node exists and cannot be deleted or duplicated

---

### Requirement: Merge settings via Merge node

The system SHALL expose video merge and export settings through the Merge node properties panel.

#### Scenario: Edit Merge node settings

- **WHEN** user selects the Merge node on the canvas
- **THEN** the properties panel displays BGM file selector, subtitle template style, output format, global color grading, and audio mix volume fields

#### Scenario: Merge node is unique

- **WHEN** a project is created
- **THEN** exactly one Merge node exists and cannot be deleted or duplicated

---

### Requirement: Project status lifecycle

The system SHALL track and update the overall project status through its lifecycle.

#### Scenario: Project status transitions

- **WHEN** all shots are in draft status, the project status is `draft`
- **WHEN** at least one shot is generating, the project status is `generating`
- **WHEN** all shots are completed, the project status is `ready_to_merge`
- **WHEN** merge is in progress, the project status is `merging`
- **WHEN** merge completes, the project status is `completed`

#### Scenario: Failed shot blocks merge

- **WHEN** any shot has a `failed` status
- **THEN** the project status is not `ready_to_merge` until the shot is retried or skipped
