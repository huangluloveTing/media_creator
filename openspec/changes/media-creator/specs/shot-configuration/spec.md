## ADDED Requirements

### Requirement: Prompt editing

The system SHALL provide a text editor for the Shot node's AI generation prompt.

#### Scenario: Edit prompt

- **WHEN** user types in the prompt text area of a selected Shot
- **THEN** the prompt is saved to the database on blur or after a debounce period

#### Scenario: Prompt with global style

- **WHEN** a global style prompt is set in the Start node
- **THEN** the Shot properties panel shows a preview of the combined prompt (global style + shot-specific prompt) that will be sent to Seedance

---

### Requirement: Camera parameters

The system SHALL allow configuring camera shot size, angle, movement type, and duration for each Shot.

#### Scenario: Configure camera settings

- **WHEN** user selects a Shot node and clicks the Camera tab
- **THEN** dropdown/select controls are available for shot size (extreme-wide/wide/medium/close-up/extreme-close-up), angle (eye-level/low/high/dutch/aerial), movement (static/pan/tilt/dolly/zoom/handheld), and a number input for duration in seconds

#### Scenario: Camera params injected into prompt

- **WHEN** the Shot is submitted for generation
- **THEN** the camera parameters are appended to the prompt as descriptive keywords (e.g., "close-up shot, low angle, dolly movement, 5 seconds")

---

### Requirement: Content constraints

The system SHALL allow specifying required and forbidden elements for each Shot.

#### Scenario: Add required elements

- **WHEN** user adds tags to the "Must Include" field (e.g., "wooden cabin", "smoke")
- **THEN** these elements are injected into the Seedance prompt as positive constraints

#### Scenario: Add forbidden elements

- **WHEN** user adds tags to the "Avoid" field (e.g., "people", "modern buildings")
- **THEN** these elements are appended to the prompt as negative constraints

#### Scenario: Upload reference images

- **WHEN** user uploads reference images (character reference, scene reference)
- **THEN** the images are saved locally and their paths are sent as `reference_image` parameters to Seedance

---

### Requirement: Generation parameters

The system SHALL allow selecting the Seedance model, aspect ratio, and resolution per Shot.

#### Scenario: Select generation model

- **WHEN** user selects a Shot and navigates to the generation params tab
- **THEN** dropdown controls show available models (Seedance 2.0, 2.0 Fast, 1.5 Pro), aspect ratios (16:9, 9:16, 4:3, 1:1), and resolutions (480p, 720p, 1080p)

#### Scenario: Inherit default aspect ratio

- **WHEN** user does not explicitly set the aspect ratio for a Shot
- **THEN** the aspect ratio defaults to 16:9

---

### Requirement: Edge transition configuration

The system SHALL allow editing transition settings on each connection edge between nodes.

#### Scenario: Edit transition on edge

- **WHEN** user clicks an edge between two Shot nodes
- **THEN** the properties panel shows transition type (cut/dissolve/fade/wipe), duration in seconds, and an optional subtitle text field for that transition

#### Scenario: Default transition

- **WHEN** a new edge is created between two nodes
- **THEN** the transition defaults to the project's global default transition type and duration, as set in the Start node
