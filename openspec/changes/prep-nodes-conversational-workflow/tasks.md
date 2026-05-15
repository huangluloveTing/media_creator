## 1. Data Model & Migration

- [x] 1.1 Define PrepNode base interface and CharacterData / WorldSettingData / StoryOutlineData types in `packages/shared/src/types.ts`
- [x] 1.2 Add `prepNodes` field to Project entity (`apps/server/src/modules/project/entities/project.entity.ts`) and create migration
- [x] 1.3 Migrate existing `characterProfileJson` data to new `prepNodes` array format (one Character node per project)
- [x] 1.4 Update `create-project.dto.ts` to include optional `prepNodes`

## 2. PrepNode Flow Editor Integration

- [x] 2.1 Create `PrepNode` base wrapper component that renders differently per type
- [x] 2.2 Refactor `CharacterNode.tsx` to render as PrepNode subtype with multi-character summary
- [x] 2.3 Create `WorldSettingNode.tsx` component for world_setting type
- [x] 2.4 Create `StoryOutlineNode.tsx` component for story_outline type
- [x] 2.5 Update `FlowEditor.tsx` to render all prep nodes before the shot container, ordered by `order` field

## 3. Chatbox State Machine Upgrade

- [x] 3.1 Replace `character_drafting`/`character_confirmed` states with `prep_drafting`/`prep_confirmed` in `ChatboxPanel.tsx`
- [x] 3.2 Add `currentPrepNodeId` state and prep node dropdown selector to ChatboxPanel header
- [x] 3.3 Implement prep node switching logic (update currentPrepNodeId, insert system divider)
- [x] 3.4 Update gating logic to check all required prep nodes confirmed before allowing storyboard generation
- [x] 3.5 Implement natural language prep node switching (LLM intent recognition for "切换到世界观" etc.)

## 4. Conversational Prep Creation (Backend)

- [x] 4.1 Design phase-aware system prompt assembly in `LlmService` with role switching per prep node type
- [x] 4.2 Implement prep drafting endpoint or extend existing stream endpoint to handle prep phase
- [x] 4.3 Implement structured JSON extraction from LLM dialogue output (parse prep data into typed schema)
- [x] 4.4 Add prep constraint collection method in `StoryboardService` (gather all confirmed prep nodes)
- [x] 4.5 Update storyboard generation prompt to inject full prep context (characters + world + outline)
- [x] 4.6 Update `resolveCharacterProfile` to read from `prepNodes` array instead of `characterProfileJson`

## 5. PrepNode Properties Panel

- [x] 5.1 Refactor `CharacterProperties.tsx` to support multi-character editing (add/remove/reorder)
- [x] 5.2 Create `WorldSettingProperties.tsx` panel for era/location/atmosphere/rules/visualStyle fields
- [x] 5.3 Create `StoryOutlineProperties.tsx` panel for premise/plotBeats/tone/targetShotCount fields
- [x] 5.4 Update `PropertiesPanel.tsx` to dispatch correct panel based on selected prep node type

## 6. SSE Events & Frontend Rendering

- [x] 6.1 Add `prep-extracted` SSE event (prep data structured extraction result)
- [x] 6.2 Add `prep-switched` SSE or client-side event (prep node focus changed)
- [x] 6.3 Render prep extraction results as formatted system cards in ChatboxPanel
- [x] 6.4 Show prep constraint summary card in ChatboxPanel side panel (all confirmed prep nodes)

## 7. Project Context & API Updates

- [x] 7.1 Update `ProjectContext.tsx` to include `prepNodes` in state and dispatch
- [x] 7.2 Add prep node CRUD endpoints or extend existing project update endpoint
- [x] 7.3 Update `api/client.ts` frontend API layer with prep node methods

## 8. Testing

- [x] 8.1 Backend unit tests: prep constraint collection, phase-aware prompt assembly, structured extraction
- [x] 8.2 Backend integration tests: prep phase gating, prep context injection into storyboard generation
- [x] 8.3 Frontend unit tests: prep node switching, state machine transitions, multi-character editing
- [x] 8.4 E2E test: full "先prep后分镜" user flow (character creation → world setting → storyboard)
