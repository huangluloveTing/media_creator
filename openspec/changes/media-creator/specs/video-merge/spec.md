## ADDED Requirements

### Requirement: Concatenate video clips

The system SHALL concatenate all generated video clips in pipeline order into a single video file.

#### Scenario: Merge all completed shots

- **WHEN** all shots are in `completed` status and user clicks "Merge" on the Merge node
- **THEN** FFmpeg concatenates all shot video files in order using the concat demuxer

#### Scenario: Merge blocked by incomplete shots

- **WHEN** user clicks "Merge" but not all shots are `completed`
- **THEN** the merge request is rejected with a message listing which shots are not yet ready

#### Scenario: Merge placeholder for missing shots

- **WHEN** a shot is skipped (user marks it as skipped) and merge is triggered
- **THEN** the skipped shot position is rendered as a black placeholder or the adjacent transition is adjusted

---

### Requirement: Apply transitions between clips

The system SHALL apply the transition effect specified on each edge when merging adjacent clips.

#### Scenario: Dissolve transition

- **WHEN** an edge has `dissolve` transition type with duration N seconds
- **THEN** FFmpeg applies an xfade dissolve filter of N seconds between the two adjacent clips

#### Scenario: Cut transition

- **WHEN** an edge has `cut` transition type (duration 0)
- **THEN** the clips are concatenated directly with no transition effect

#### Scenario: Fade transition

- **WHEN** an edge has `fade` transition type with duration N seconds
- **THEN** FFmpeg applies an xfade fadeblack filter of N seconds

#### Scenario: Wipe transition

- **WHEN** an edge has `wipe` transition type with duration N seconds
- **THEN** FFmpeg applies an xfade wipeleft (or configured direction) filter of N seconds

---

### Requirement: Mix background music

The system SHALL mix a user-provided BGM audio file with the merged video.

#### Scenario: Add BGM

- **WHEN** a BGM file is set in the Merge node and merge is triggered
- **THEN** the BGM is mixed into the final video audio track, looping or trimming to match the total video duration

#### Scenario: Adjust audio levels

- **WHEN** BGM volume and original audio volume are set in the Merge node
- **THEN** FFmpeg applies the specified volume levels during mixing, defaulting to 30% BGM and 100% original audio

#### Scenario: No BGM specified

- **WHEN** no BGM file is configured
- **THEN** the original audio from all clips is preserved without modification

---

### Requirement: Overlay subtitles

The system SHALL overlay subtitle text defined on edges onto the final video.

#### Scenario: Render subtitles

- **WHEN** edges have subtitle text set and merge is triggered
- **THEN** each subtitle is rendered at the timestamp corresponding to its position in the timeline, using SRT format or drawtext filter

#### Scenario: Subtitle styling

- **WHEN** subtitle style is configured in the Merge node (font, size, color, position)
- **THEN** all subtitles are rendered with the specified style

---

### Requirement: Output final video

The system SHALL output the final merged video to the configured output directory.

#### Scenario: Successful export

- **WHEN** the merge completes successfully
- **THEN** the final video is saved to `{output_dir}/{project_title}_final.mp4`, and the project status updates to `completed`

#### Scenario: Merge failure

- **WHEN** FFmpeg encounters an error during merge
- **THEN** the merge task status is updated with the error message, and the project status remains `ready_to_merge` for retry

#### Scenario: Output directory validation

- **WHEN** the configured output directory does not exist
- **THEN** the system creates the directory before starting the merge
