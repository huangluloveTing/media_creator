## 1. Project Scaffolding

- [x] 1.1 Initialize NestJS backend with required modules (Project, Shot, Seedance, FFmpeg, Storage)
- [x] 1.2 Initialize React + TypeScript frontend with Vite
- [x] 1.3 Configure monorepo tooling (shared tsconfig, eslint, prettier)
- [x] 1.4 Add backend dependencies: @nestjs/typeorm, pg, @nestjs/config, axios, fluent-ffmpeg
- [x] 1.5 Add frontend dependencies: @xyflow/react, zustand (or React Context), lucide-react

## 2. Database & Entities

- [x] 2.1 Create TypeORM entities: Project, Shot, Edge, GenerationTask
- [x] 2.2 Configure TypeORM with PostgreSQL connection and environment-based config
- [x] 2.3 Generate initial migration and verify database tables
- [x] 2.4 Create DTOs for Project, Shot, Edge CRUD operations

## 3. Backend: Project Management

- [x] 3.1 Implement ProjectController: CRUD endpoints (POST/GET/:id/PUT/DELETE /api/projects)
- [x] 3.2 Implement ProjectService: create project with auto-created Start/Merge settings
- [x] 3.3 Implement project status lifecycle logic (draft→generating→ready_to_merge→merging→completed)
- [x] 3.4 Add GET /api/projects/:id/full endpoint returning project + shots + edges for canvas hydration
- [x] 3.5 Validate project settings (resolution, fps, output_dir)

## 4. Backend: Shot & Edge CRUD

- [x] 4.1 Implement ShotController: CRUD + reorder endpoints
- [x] 4.2 Implement ShotService: create/update/delete with automatic edge reconnection
- [x] 4.3 Implement EdgeController: update transition settings
- [x] 4.4 Implement EdgeService: handle edge insertion when shot is added between two nodes
- [x] 4.5 Implement reorder logic: update shot.order and edge.position on drag reorder
- [x] 4.6 Implement cascade delete: removing a shot reconnects its upstream/downstream edges

## 5. Backend: Seedance Integration

- [x] 5.1 Implement SeedanceService.submit(): POST to Ark API with combined prompt + camera keywords + reference images
- [x] 5.2 Implement SeedanceService.poll(): GET task status with configurable interval (3s default)
- [x] 5.3 Implement SeedanceService.download(): download video to local storage, extract last frame via FFmpeg
- [x] 5.4 Implement Shot generation trigger: POST /api/shots/:id/generate
- [x] 5.5 Implement batch generate: POST /api/projects/:id/generate-all with concurrency limit
- [x] 5.6 Implement GET /api/projects/:id/shots returning all shots with generation status for frontend polling
- [x] 5.7 Handle Seedance API errors: timeouts, rate limits, invalid prompts → GenerationTask error state

## 6. Backend: FFmpeg Merge Service

- [x] 6.1 Implement FFmpegService.concat(): generate concat demuxer input list from shot files in order
- [x] 6.2 Implement FFmpegService.applyTransitions(): build xfade filter_complex from edge transition configs
- [x] 6.3 Implement FFmpegService.mixAudio(): overlay BGM with configurable volume, loop/trim to video duration
- [x] 6.4 Implement FFmpegService.overlaySubtitles(): generate SRT from edge subtitle_text, burn into video
- [x] 6.5 Implement merge endpoint: POST /api/projects/:id/merge
- [x] 6.6 Validate merge prerequisites: all shots completed, output directory writable
- [x] 6.7 Report merge progress via polling or SSE

## 7. Frontend: React Flow Canvas

- [x] 7. Set up React Flow canvas component with viewport controls (zoom, pan, fit view)
- [x] 7. Create custom StartNode component (icon, title, brief settings summary)
- [x] 7. Create custom ShotNode component (order number, prompt preview, status icon + progress bar)
- [x] 7. Create custom MergeNode component (icon, title, BGM indicator)
- [x] 7. Create custom Edge component with transition type label and duration display
- [x] 7. Implement HydrateFlow: load project data and convert to React Flow nodes + edges on mount

## 8. Frontend: Node Interactions

- [x] 8. Implement NodePalette component with draggable Shot node
- [x] 8. Implement drag-from-palette-to-edge: insert new shot at drop position
- [x] 8. Implement drag-from-palette-to-canvas: append new shot at pipeline end
- [x] 8. Implement drag-reorder: move an existing Shot node to a new position with automatic API update
- [x] 8. Implement delete node with confirmation: remove shot, reconnect edges via API
- [x] 8. Implement click-to-select: highlight node/edge, open corresponding properties panel

## 9. Frontend: Properties Panels

- [x] 9. Implement PropertiesPanel container with dynamic content based on selected element type
- [x] 9. Implement StartProperties: resolution, fps, default transition, output dir, global style prompt
- [x] 9. Implement ShotProperties: prompt editor, camera params selects, constraints tags, generation params
- [x] 9. Implement EdgeProperties: transition type select, duration input, subtitle text input
- [x] 9. Implement MergeProperties: BGM file picker, subtitle style, output format, audio mix sliders
- [x] 9. Implement auto-save with debounce on all property changes

## 10. Frontend: Generation Workflow

- [x] 10. Implement "Generate" button on Shot node and in properties panel
- [x] 10. Implement "Generate All" button in toolbar
- [x] 10. Implement polling hook: usePollGenerationStatus(projectId) every 3 seconds
- [x] 10. Display shot status on canvas nodes (draft/queued/generating+progress/completed/failed)
- [x] 10. Implement retry button on failed shots
- [x] 10. Implement "Merge" button on Merge node, show merge progress
- [x] 10. Show final video player with download link after successful merge

## 11. Minimap & Canvas UX

- [x] 11. Integrate React Flow Minimap component
- [x] 11. Show/hide minimap based on shot count threshold (4+ shots)
- [x] 11. Add "Fit View" and "Reset Zoom" toolbar buttons
- [x] 11. Add keyboard shortcuts: Delete to remove selected node, Ctrl+S to save
- [x] 11. Visual polish: node status color coding, edge animation during generation

## 12. Testing & Verification

- [x] 12.1 Write unit tests for ProjectService and ShotService edge reconnection logic
- [x] 12.2 Write unit tests for SeedanceService with mocked HTTP calls
- [x] 12.3 Write unit tests for FFmpegService filter_complex generation
- [x] 12.4 Write frontend component tests for ShotNode status display states
- [x] 12.5 Write E2E test: create project → add shots → configure → generate flow
- [x] 12.6 Verify test coverage meets 80% threshold
