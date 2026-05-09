## ADDED Requirements

### Requirement: Canvas with node rendering

The system SHALL render a React Flow canvas displaying Start, Shot, and Merge nodes connected by directed edges in a linear pipeline.

#### Scenario: Initial canvas state

- **WHEN** user opens a new project
- **THEN** the canvas displays a Start node connected to a Merge node with a dashed placeholder edge

#### Scenario: Shot nodes appear in order

- **WHEN** shot nodes exist in the project
- **THEN** they are displayed left to right in order: Start → Shot1 → Shot2 → ... → Merge

---

### Requirement: Drag shot node from palette

The system SHALL allow users to add new Shot nodes by dragging from a node palette onto the canvas.

#### Scenario: Drag onto an edge

- **WHEN** user drags a Shot from the palette and drops it onto the edge between Shot A and Shot B
- **THEN** a new Shot is created and inserted between A and B, the old edge is removed, and two new edges are created: A→NewShot and NewShot→B

#### Scenario: Drag onto empty canvas

- **WHEN** user drags a Shot from the palette and drops it onto an empty area of the canvas
- **THEN** the new Shot is appended at the end of the pipeline, connected between the last Shot and the Merge node

---

### Requirement: Drag reorder shots

The system SHALL allow users to reorder Shot nodes by dragging them on the canvas.

#### Scenario: Move shot to a new position

- **WHEN** user drags Shot #2 and drops it between Shot #4 and Shot #5
- **THEN** Shot #2 is removed from its original position, reinserted at the new position, and all affected edges are reconnected automatically

---

### Requirement: Delete shot node

The system SHALL allow users to delete a Shot node, reconnecting its upstream and downstream neighbors.

#### Scenario: Delete a middle shot

- **WHEN** user selects Shot #2 and presses Delete
- **THEN** Shot #2 is removed from the database, and its upstream node connects directly to its downstream node via a single new edge preserving the downstream transition settings

#### Scenario: Delete the only shot

- **WHEN** user deletes the last remaining Shot node
- **THEN** the Start node connects directly to the Merge node with a placeholder edge

---

### Requirement: Click node to edit

The system SHALL open the properties panel when a node is clicked.

#### Scenario: Select a Shot node

- **WHEN** user clicks on a Shot node
- **THEN** the node is highlighted as selected, and the properties panel displays the Shot editing interface

#### Scenario: Select an edge

- **WHEN** user clicks on an edge or its label
- **THEN** the edge is highlighted as selected, and the properties panel displays the transition editing interface (type, duration, subtitle)

---

### Requirement: Minimap navigation

The system SHALL display a minimap overlay for bird's-eye navigation when the project has more than 3 shot nodes.

#### Scenario: Minimap visible with many nodes

- **WHEN** the project contains 4 or more Shot nodes
- **THEN** a minimap is displayed in the bottom-right corner of the canvas

#### Scenario: Minimap hidden with few nodes

- **WHEN** the project contains 3 or fewer Shot nodes
- **THEN** the minimap is hidden

#### Scenario: Navigate via minimap

- **WHEN** user drags the viewport rectangle on the minimap
- **THEN** the main canvas pans to the corresponding area

---

### Requirement: Canvas zoom and pan

The system SHALL support standard canvas zoom and pan interactions.

#### Scenario: Zoom with scroll wheel

- **WHEN** user scrolls the mouse wheel while holding Ctrl/Cmd
- **THEN** the canvas zooms in or out centered on the cursor position

#### Scenario: Pan with drag

- **WHEN** user drags on empty canvas area
- **THEN** the canvas pans following the mouse movement

#### Scenario: Fit view

- **WHEN** user clicks "Fit View" button
- **THEN** the canvas zooms and pans to fit all nodes in the viewport
