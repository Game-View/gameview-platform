# GAME VIEW STUDIO
## Phase 2 Sprint Plan: Build Pipeline
**Sprints 11-18 | Starts after Phase 1 completion**
**Team: James + Claude Code**

---

## Phase 2 Overview

Phase 2 transforms the creator's brief into a buildable experience. By the end of this phase, a creator can upload video, process it to 3D, place objects, configure interactions, set up game logic, and test their experience.

### Phase 2 Goals
- Video upload → 3D scene (CLI integration)
- 3D scene viewer (navigable preview)
- Object library (pre-loaded + user uploads)
- Drag-drop object placement
- Interaction setup (triggers, behaviors)
- Game logic (win conditions, scoring)
- Creator testing mode
- Creator subscriptions (gate to publishing)

### Phase 2 Exit Criteria
Creator can build Lost Masters end-to-end:
- Upload 3 venue videos
- Process to 3D scenes
- Place 12 master tape objects
- Configure "find tape = unlock song" interactions
- Set "find all 12 = win" condition
- Test the complete experience
- Subscribe to unlock publishing

---

## SPRINT 11: VIDEO UPLOAD + CLI INTEGRATION
**Week 1 of Phase 2**

Connect the UI to the CLI tool. Creator can upload video and trigger 3D processing.

### Goals
- [ ] Build video upload UI
- [ ] Integrate with CLI tool
- [ ] Handle processing status/progress
- [ ] Store processed scenes

### Tasks
- [ ] Design video upload screen
  - Drag-drop upload zone
  - File type validation (supported video formats)
  - Multiple file support (multi-camera footage)
  - Upload progress indicator
- [ ] Build upload backend
  - File storage (local/cloud)
  - File validation
  - Metadata extraction
- [ ] CLI integration
  - Trigger CLI processing from UI
  - Pass correct parameters
  - Handle CLI output
- [ ] Processing status UI
  - Progress indicator (percentage or stages)
  - Estimated time remaining
  - Error handling and retry
- [ ] Scene storage
  - Store processed Gaussian Splat output
  - Associate with project/venue
  - Thumbnail generation

### Deliverables
→ Creator can upload video files
→ Processing triggers automatically
→ Progress is visible to creator
→ Processed scene is stored and accessible

### Dependencies
Phase 1 complete (project/brief exists to attach scenes to)

### Notes
This is the bridge between Spark and Build. The CLI is the magic — we're just wrapping it in UI.

---

## SPRINT 12: 3D SCENE VIEWER
**Week 2 of Phase 2**

Build the viewer that lets creators see and navigate their processed 3D scenes.

### Goals
- [ ] Build WebGL-based 3D viewer
- [ ] Implement navigation controls
- [ ] Load Gaussian Splat scenes
- [ ] Preview mode for creators

### Tasks
- [ ] Set up 3D rendering framework
  - WebGL / Three.js setup
  - Gaussian Splat rendering support
  - Performance optimization
- [ ] Build navigation controls
  - WASD / arrow key movement
  - Mouse look / camera rotation
  - Click-to-move option
  - Touch controls for mobile
- [ ] Scene loading
  - Load processed scenes from storage
  - Handle large scene files
  - Loading progress indicator
- [ ] Viewer UI
  - Fullscreen toggle
  - Navigation help overlay
  - Exit/close button
  - Mini-map (optional)
- [ ] Creator preview mode
  - View scene before adding objects
  - Check processing quality
  - Flag issues / re-process option

### Deliverables
→ Creator can view their processed 3D scene
→ Smooth navigation (60fps target)
→ Works on desktop and mobile
→ Scene loads quickly with progress feedback

### Dependencies
Sprint 11 (processed scenes exist to view)

### Notes
This is where creators first see their real space in 3D. Make it magical. First impressions matter.

---

## SPRINT 13: OBJECT LIBRARY
**Week 3 of Phase 2**

Build the object library with pre-loaded objects and user upload capability.

### Goals
- [ ] Build object library UI
- [ ] Populate pre-loaded library
- [ ] Implement user upload flow
- [ ] Object preview and selection

### Tasks
- [ ] Design object library panel
  - Category navigation
  - Search functionality
  - Grid view of objects
  - Object preview on hover/click
- [ ] Pre-loaded library
  - Source/create starter objects (.glb/.gltf)
  - Categories: Collectibles, Furniture, Props, Interactive, Decorations
  - At least 50 objects for MVP
  - Metadata (name, category, tags)
- [ ] User upload flow
  - Upload .glb/.gltf files
  - Validation (file size, format)
  - Preview before adding to library
  - Save to creator's personal library
- [ ] Object data model
  - Object metadata schema
  - Library organization
  - Personal vs. shared libraries
- [ ] Object preview
  - 3D preview of selected object
  - Rotate/zoom preview
  - Size/scale information

### Deliverables
→ Object library panel with categories and search
→ 50+ pre-loaded objects available
→ Creator can upload custom .glb/.gltf objects
→ Objects can be previewed before placement

### Dependencies
Sprint 12 (viewer exists to eventually place objects into)

### Notes
Quality of pre-loaded objects matters. Better to have 50 good ones than 200 bad ones.

---

## SPRINT 14: DRAG-DROP OBJECT PLACEMENT
**Week 4 of Phase 2**

Enable creators to place objects from the library into their 3D scenes.

### Goals
- [ ] Implement drag-drop from library to scene
- [ ] Object positioning in 3D space
- [ ] Object manipulation (move, rotate, scale)
- [ ] Save object placements

### Tasks
- [ ] Drag-drop implementation
  - Drag object from library panel
  - Drop into 3D scene
  - Visual feedback during drag
  - Placement preview before drop
- [ ] 3D positioning
  - Click to place on surfaces
  - Snap to ground/surfaces
  - Height adjustment
  - Position gizmo (arrows for X/Y/Z)
- [ ] Object manipulation
  - Select placed objects
  - Move tool (reposition)
  - Rotate tool (orientation)
  - Scale tool (size)
  - Delete object
- [ ] Properties panel
  - Selected object info
  - Position/rotation/scale values
  - Manual input for precise placement
  - Object name/label
- [ ] Save placements
  - Store object positions per scene
  - Auto-save on changes
  - Undo/redo support

### Deliverables
→ Creator can drag objects from library to scene
→ Objects can be moved, rotated, scaled
→ Placements are saved automatically
→ Undo/redo works

### Dependencies
Sprint 12 (scene viewer) + Sprint 13 (object library)

### Notes
This is where creation starts to feel real. Make placement intuitive — if they need a manual, we failed.

---

## SPRINT 15: INTERACTION SETUP
**Week 5 of Phase 2**

Enable creators to define what happens when players interact with objects.

### Goals
- [ ] Build interaction configuration UI
- [ ] Implement trigger types
- [ ] Implement action types
- [ ] Test interactions in preview

### Tasks
- [ ] Interaction panel UI
  - Select object → see/add interactions
  - "When [trigger], do [action]" pattern
  - Plain language, no code
  - Multiple interactions per object
- [ ] Trigger types
  - Proximity (player gets near)
  - Click/Touch (player interacts)
  - Collision (player touches)
  - Collect (player picks up)
  - Conditional (when X is true)
- [ ] Action types
  - Play sound/audio
  - Show message/text
  - Add to inventory
  - Increment score
  - Unlock content
  - Show/hide object
  - Teleport player
  - Trigger animation
- [ ] Interaction preview
  - Test interaction in viewer
  - See trigger zones
  - Verify actions work
- [ ] Data model
  - Interaction schema
  - Save interactions with scene
  - Interaction validation

### Deliverables
→ Creator can add interactions to any placed object
→ "When player touches tape, play audio and add to inventory" works
→ Interactions can be tested in preview mode
→ Multiple triggers and actions supported

### Dependencies
Sprint 14 (objects must be placed first)

### Notes
This is the "game" in "game creation." Keep it simple: trigger → action. Advanced users can chain them.

---

## SPRINT 16: GAME LOGIC
**Week 6 of Phase 2**

Enable creators to configure win conditions, scoring, progression, and rewards.

### Goals
- [ ] Build game logic configuration UI
- [ ] Implement inventory system
- [ ] Implement scoring system
- [ ] Implement win conditions
- [ ] Configure rewards

### Tasks
- [ ] Game logic panel UI
  - Experience-level settings (not per-object)
  - Win condition configuration
  - Scoring settings
  - Progression settings
- [ ] Inventory system
  - Track collected items
  - Inventory display (player UI)
  - Item count / completion tracking
  - "Collected X of Y" logic
- [ ] Scoring system
  - Point values per action
  - Score display
  - Leaderboard ready (data structure)
  - Time bonuses (optional)
- [ ] Win conditions
  - "Collect all X" condition
  - "Reach score Y" condition
  - "Complete within time" condition
  - Multiple conditions (AND/OR)
  - Win trigger → what happens
- [ ] Progression system
  - Venue/scene unlocking
  - Sequential vs. open access
  - Difficulty scaling
- [ ] Rewards configuration
  - On-completion rewards
  - Unlock content
  - Display achievement
  - Prize pool integration (structure only)

### Deliverables
→ Creator can set "find all 12 tapes = win"
→ Inventory tracks collected items
→ Score tracks points
→ Win condition triggers completion flow
→ Rewards are granted on win

### Dependencies
Sprint 15 (interactions feed into game logic)

### Notes
This is where Lost Masters comes together. "Find all 12 tapes across 3 venues" = win condition + inventory + progression.

---

## SPRINT 17: CREATOR TESTING MODE
**Week 7 of Phase 2**

Enable creators to fully test their experience before publishing.

### Goals
- [ ] Build testing mode UI
- [ ] Implement play-through mode
- [ ] Add debug tools
- [ ] Generate testing checklist

### Tasks
- [ ] Testing mode UI
  - "Test Experience" button
  - Enter testing mode (full-screen play)
  - Exit testing mode
  - Testing toolbar
- [ ] Play-through mode
  - Play as a player would
  - All interactions active
  - Inventory/score functional
  - Win condition functional
- [ ] Debug tools
  - Show trigger zones (visible outlines)
  - Show collision boundaries
  - Teleport to any location
  - Reset experience to start
  - Skip to any scene/venue
  - Trigger any interaction manually
- [ ] Testing checklist
  - AI-generated based on brief
  - Checkboxes for each item
  - Mark issues for fixing
  - Example: "[ ] All 12 tapes are findable"
- [ ] Issue tracking
  - Flag issues during testing
  - Notes per issue
  - Link to specific objects/interactions
  - Mark as resolved

### Deliverables
→ Creator can play through their complete experience
→ Debug tools help identify issues
→ Checklist ensures nothing is missed
→ Issues can be tracked and resolved

### Dependencies
Sprint 16 (game logic must work for testing to be meaningful)

### Notes
Creators will find their own bugs. Give them the tools to do it efficiently. Don't let them publish broken experiences.

---

## SPRINT 18: MULTI-SCENE + SUBSCRIPTIONS
**Week 8 of Phase 2**

Handle multi-venue experiences and add creator subscription payment (gate to publishing).

### Goals
- [ ] Support multiple scenes per project
- [ ] Scene navigation/transitions
- [ ] Implement creator subscriptions
- [ ] Polish and bug fixes

### Tasks
- [ ] Multi-scene support
  - Add multiple scenes to one project
  - Scene list/management UI
  - Scene-level settings
  - Copy objects between scenes
- [ ] Scene navigation
  - Portals/doors between scenes
  - Scene transition effects
  - Player position preservation
  - Scene unlock logic
- [ ] Creator subscriptions
  - Subscription tiers (if applicable)
  - Payment integration (Stripe or similar)
  - Subscription status tracking
  - "Subscribe to publish" gate
  - Free tier limitations (if any)
- [ ] Phase 2 polish
  - Bug fixes from testing
  - Performance optimization
  - UX improvements
  - Edge case handling
- [ ] Documentation
  - Update help content
  - Tool tips
  - Error messages

### Deliverables
→ Lost Masters with 3 venues works end-to-end
→ Scene transitions work smoothly
→ Creator can subscribe to unlock publishing
→ Phase 2 is stable and polished

### Dependencies
Sprints 11-17 complete

### Notes
This sprint is about completion. Lost Masters should be fully buildable. Subscription gates Phase 3 (publishing).

---

## Phase 2 Summary

| Sprint | Focus | Key Deliverable |
|--------|-------|-----------------|
| 11 | Video Upload + CLI | Creator uploads video → 3D processing |
| 12 | 3D Scene Viewer | Creator sees and navigates their 3D scene |
| 13 | Object Library | Pre-loaded objects + user uploads |
| 14 | Drag-Drop Placement | Creator places objects in scene |
| 15 | Interaction Setup | "When X, do Y" configuration |
| 16 | Game Logic | Win conditions, scoring, inventory |
| 17 | Testing Mode | Creator tests complete experience |
| 18 | Multi-Scene + Subscriptions | Multiple venues, payment gate |

---

## Phase 2 Exit Checklist

- [ ] Creator can upload multi-camera video
- [ ] Video processes to 3D via CLI
- [ ] 3D scene is viewable and navigable
- [ ] Object library has 50+ pre-loaded objects
- [ ] Creator can upload custom objects
- [ ] Objects can be dragged into scene
- [ ] Objects can be moved, rotated, scaled
- [ ] Interactions can be configured (trigger → action)
- [ ] Game logic works (inventory, score, win condition)
- [ ] Testing mode allows full play-through
- [ ] Multiple scenes/venues work together
- [ ] Scene transitions work
- [ ] Creator subscription payment works
- [ ] Lost Masters is fully buildable

**When all boxes are checked → Phase 3 begins**
