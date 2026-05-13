## ADDED Requirements

### Requirement: Canvas auto-fits when shots change
The canvas SHALL automatically adjust the viewport when shot count changes, so all nodes remain visible without manual scrolling.

#### Scenario: Shot added, canvas auto-fits
- **WHEN** a user adds a new shot (clicking "+ 新增分镜")
- **WHEN** the canvas nodes are updated with the new shot container width
- **THEN** the viewport SHALL automatically zoom/pan to show all nodes
- **THEN** the viewport SHALL have 20% padding around the nodes

#### Scenario: Shot deleted, canvas auto-fits
- **WHEN** a user deletes a shot
- **WHEN** the canvas nodes are updated
- **THEN** the viewport SHALL automatically zoom/pan to show remaining nodes

#### Scenario: Initial load, canvas fits
- **WHEN** a project editor page loads for the first time
- **THEN** the viewport SHALL fit all nodes on initial render

#### Scenario: No disruptive animation during manual interaction
- **WHEN** a user manually pans or zooms the canvas
- **THEN** the auto-fit SHALL NOT override the user's current viewport
