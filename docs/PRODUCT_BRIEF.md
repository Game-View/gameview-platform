# GAME VIEW STUDIO
## Product Brief: AI-Powered Experience Creation Platform
**Version 1.2 | December 2024**

---

## PART 1: VISION & STRATEGY

### 1. Vision Statement

**Game View transforms real-world spaces into playable experiences.**

We're building the platform that lets creators — musicians, athletes, brands, venues — turn video footage of their real spaces into interactive 3D experiences their audiences can explore. No coding required. No 3D modeling expertise needed.

> **Film your venue. Describe your vision. Publish your experience.**

#### What Makes This Different
- **Real places, not fantasy worlds** — Your actual venue becomes the game
- **Video in, game out** — iPhone/GoPro footage transforms into explorable 3D
- **AI-guided creation** — Claude helps you build, not just a blank canvas
- **Nobody else does this** — You can make cartoon games elsewhere. You can make synthetic 3D worlds. But turning your real space into an interactive experience? That's only us.

---

### 2. Target Customers

| Segment | Who They Are | What They Want | Example Use Case |
|---------|--------------|----------------|------------------|
| **Musicians / Artists** | Performers with venues, fans, and stories to tell | Deeper fan engagement beyond streaming | Lost Masters: Treasure hunt across tour venues |
| **Sports / Entertainment** | Teams, leagues, venues with passionate fanbases | Fan experiences, behind-the-scenes access | Stadium tour with hidden collectibles, VIP unlocks |
| **Brands / Agencies** | Marketing teams seeking interactive campaigns | Immersive brand activations that stand out | Product launch scavenger hunt in flagship store |
| **Venues / Events** | Concert halls, museums, event spaces | New revenue streams, virtual access | Virtual venue tour with ticket presale unlocks |
| **Content Creators** | YouTubers, streamers, influencers with engaged audiences | Unique experiences to offer their community | Explore my studio, find easter eggs, unlock content |

**Common Thread:** They all have real spaces, engaged audiences, and stories to tell — but no technical ability to build interactive experiences.

---

### 3. The Three-Phase Journey

```
PHASE 1: SPARK                    PHASE 2: BUILD                   PHASE 3: PLATFORM
"What do you want to create?"     "Let's build it"                 "Share it with the world"
           │                              │                                │
           ▼                              ▼                                ▼
┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
│ • User Profile      │        │ • Video Upload      │        │ • Publishing Flow   │
│ • Spark Chat        │        │ • 3D Rendering      │        │ • Game View Platform│
│ • AI Q&A            │───────▶│ • Scene Viewer      │───────▶│ • Discovery/Browse  │
│ • Brief Generation  │        │ • Object Library    │        │ • Player Experience │
│                     │        │ • Drag-Drop         │        │ • Analytics         │
│                     │        │ • Interactions      │        │ • Player Payments   │
│                     │        │ • Game Logic        │        │                     │
│                     │        │ • Testing Mode      │        │                     │
│                     │        │ • Creator Subs      │        │                     │
└─────────────────────┘        └─────────────────────┘        └─────────────────────┘
     Brief ready                  Experience built               Players playing
     Sprints 1-10                 Sprints 11-18                  Sprints 19-22
```

---

### 4. Critical to Quality: Phase Acceptance Criteria

#### Phase 1: Spark (Sprints 1-10)
*"Creator goes from idea to blueprint"*

| Criteria | Measure |
|----------|---------|
| Any creator can describe their vision | No technical jargon required in input |
| AI understands and shapes the concept | >90% say "AI understood my vision" |
| Conversation feels natural, not robotic | <15 turns to complete brief |
| Output is actionable, not vague | Brief maps directly to build tasks |
| Creator feels ownership | >70% say brief reflects THEIR ideas |

**Exit Criteria:** Creator can go from "I want fans to explore my venue" to a structured, buildable project brief in under 30 minutes.

#### Phase 2: Build Pipeline (Sprints 11-18)
*"Creator builds the experience they envisioned"*

| Criteria | Measure |
|----------|---------|
| Video → 3D works reliably | >95% of properly-captured videos process successfully |
| 3D viewer is smooth and immersive | 60fps on mid-tier hardware |
| Object placement is intuitive | Drag-drop, no coordinates, no code |
| Interactions are easy to set up | "When player touches X, do Y" — plain language |
| Game logic is configurable without code | Win conditions, scoring, progression via UI |
| Creator can test their own experience | Play-through mode before publishing |
| Subscription payment works | Creator can subscribe to unlock publishing |

**Exit Criteria:** Creator can upload video, process to 3D, place objects, configure interactions, define win conditions, and test the complete experience — without writing code.

#### Phase 3: Platform (Sprints 19-22)
*"Players discover and play the experience"*

| Criteria | Measure |
|----------|---------|
| Publishing is one-click simple | Creator hits "Publish" and it's live |
| Players can find experiences | Browse, search, categories, featured |
| Playing is instant | No download, no install, click and play |
| Experiences work cross-platform | Web, mobile, desktop |
| Creators see engagement | Analytics: plays, completions, time spent |
| Creators can charge players | Payment flow works, revenue tracked |
| Prize pools work | Competition prizes can be configured and awarded |

**Exit Criteria:** Creator publishes Lost Masters. Players find it on Game View, click play, explore 3 venues, find 12 tapes, complete the experience — seamless from discovery to completion.

---

### 5. Business Infrastructure

| Component | What It Enables | Phase |
|-----------|-----------------|-------|
| Multi-tenant Environment | Isolated accounts, projects, assets per creator | Phase 1 (foundational) |
| Creator Subscriptions | Creators pay to use Game View Studio (SaaS) | Phase 2 (gate to publishing) |
| Player Payments | Creators can charge players to access experiences | Phase 3 |
| Prize Pool Management | Handle competition prizes (Lost Masters' $10K) | Phase 3 |
| Revenue Share | Game View takes cut of player payments (future) | Post-MVP |

---

### 6. Success Definition

At the end of 22 sprints, this scenario works end-to-end:

1. **Zac Brown's team signs up** → Completes profile (Musician, Professional, Has footage)
2. **Opens Spark** → "We want a treasure hunt across 3 tour venues where fans find hidden master tapes"
3. **AI conversation** → Refines concept, asks about prizes, unlocks, narrative
4. **Brief generated** → 12 tapes, 3 venues, progressive difficulty, $10K grand prize
5. **Build Pipeline** → Upload venue videos → Process to 3D → Place tape objects → Configure "find tape = unlock song" interactions → Set win condition
6. **Test** → Walk through all 3 venues, verify all 12 tapes work
7. **Subscribe** → Pay for Game View Studio subscription
8. **Publish** → One click to Game View Platform
9. **Fans play** → Find Lost Masters on Game View, click play, explore venues, hunt tapes, complete album
10. **Creator sees analytics** → 50K plays, 12K completions, engagement metrics

**If this works, we've built something nobody else has.**

---

## PART 2: SPARK (Project Brief Chat Flow)

### 7. Entry Point: The Opening Prompt

#### 7.1 Primary Prompt
The conversation begins with a single, open-ended question:

> **"What do you want people to experience?"**

#### 7.2 Supporting Context
Below the input field:

> Tell us about your idea — whether it's a treasure hunt, a virtual tour, an interactive story, or something you haven't fully defined yet. Share as much or as little as you have. We'll help you shape it from there.

#### 7.3 Input Options
- **Upload a document** - PDF, Word doc, or text file with existing concept work
- **Type directly** - Freeform text description of any length

#### 7.4 Why This Approach
- "Experience" is broader than "game" - doesn't intimidate non-gamers
- Examples span the spectrum (treasure hunt → tour → story)
- Explicitly invites incomplete ideas
- No wrong answers - whatever they have is valid input

---

### 8. Input Classification

The AI's first task is to assess what the creator has provided and determine the appropriate conversation path.

#### Type A: Detailed Document
Creator uploads something structured, detailed, production-ready (like the Lost Masters concept doc).

**AI Response Pattern:** Confirm understanding, validate feasibility, ask targeted refinement questions.

> "This is a well-developed concept! Let me make sure I understand: You want a treasure hunt across 3 music venues where players find 12 hidden master tapes, each unlocking exclusive audio content. A few questions to finalize the spec..."

#### Type B: Partial Concept
Creator has some ideas but not a complete vision.

**AI Response Pattern:** Acknowledge what exists, identify gaps, guide toward completeness.

> "Great start! You've got a clear setting (your concert venue) and core mechanic (finding hidden items). Let's fill in some details: What are players finding, and why does it matter to them?"

#### Type C: Vague Idea
Creator has a spark but hasn't developed it.

**AI Response Pattern:** Validate the spark, ask foundational questions, build from scratch.

> "Love it — an exploration experience with hidden discoveries. Let me ask a few things to flesh this out: What's the venue? What are they finding? Is there a story wrapper?"

#### Type D: Still Exploring (No Specific Vision)
Creator selected "Still exploring" in their profile, or indicates they don't have a specific idea.

**AI Response Pattern:** Redirect to Sandbox mode rather than forcing a brief.

> "No problem! Sounds like you're still figuring out what's possible. Let me show you around — I'll drop you into a demo venue where you can explore, try adding objects, and see how it all works. When something clicks, we'll build it for real."

*Sandbox mode provides a low-pressure environment to learn the platform without committing to a project.*

---

### 9. Question Framework

The AI asks questions to transform any input into a structured brief. Questions fall into categories that map directly to Game View's pipeline.

#### 9.1 Foundation Questions (Always Asked)

| Category | Questions |
|----------|-----------|
| **Venue/Setting** | What real-world space(s) will players explore? Do you have video footage already, or do we need to plan capture? How many distinct locations/scenes? |
| **Core Mechanic** | What do players DO? (explore, find, collect, solve, discover) What are they interacting with? Is there progression (levels, difficulty)? |
| **Narrative** | Is there a story wrapper? (why are they doing this?) Who is the player in this world? What's at stake? |
| **Win Condition** | How does the experience end? What happens when they complete it? Are there rewards? |
| **Audience** | Who is this for? (fans, customers, general public) Single player or multiplayer? Competitive or collaborative? |

#### 9.2 Conditional Questions (Based on Responses)

**If Competitive/Prize-Based:**
- What's the prize structure?
- How are winners determined? (first to complete, highest score, random draw)
- Is there a time limit?

**If Multiple Venues:**
- Are venues unlocked sequentially or all available at once?
- Does difficulty increase across venues?
- Is there a narrative thread connecting them?

**If Collectibles:**
- How many items total?
- Are they visible or hidden?
- Do they unlock content when found?

**If Branded/Sponsored:**
- What brand elements need to be included?
- Are there specific products to feature?
- Any brand guidelines to follow?

---

### 10. Conversation Flow

#### 10.1 Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  AI loads creator profile (from signup)                 │
│  • Creator type (musician, content creator, etc.)       │
│  • Experience level                                     │
│  • Footage status                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PERSONALIZED opening prompt                            │
│  "Hey [Name] — [contextual greeting based on profile]"  │
│  "What do you want people to experience?"               │
│  [Upload] or [Type here...]                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  AI classifies input (A/B/C/D)                          │
│  Responds appropriately to input type                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Foundation Questions                                   │
│  (Venue, Mechanic, Narrative, Win, Audience)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Conditional Questions                                  │
│  (Based on creator's answers)                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  AI generates draft brief                               │
│  Presents to creator for review                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Creator approves / requests changes                    │
│  Iterate until agreement                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BRIEF FINALIZED                                        │
│  Handoff to Build Pipeline →                            │
└─────────────────────────────────────────────────────────┘
```

#### 10.2 Conversation Principles

- **One question at a time (when possible)** - Don't overwhelm with a wall of questions. Group 2-3 related questions max.
- **Acknowledge before asking** - Always validate what they've shared before requesting more.
- **Offer suggestions, not just questions** - "Would you like players to find items, solve puzzles, or both?"
- **Make decisions reversible** - "We can always change this later if it doesn't feel right."
- **Show progress** - Let them know how close they are to a complete brief.

---

### 11. Brief Output Format

When the conversation is complete, the AI generates a structured brief.

#### 11.1 Brief Template Structure

```
╔════════════════════════════════════════════════════════════╗
║  [EXPERIENCE NAME]                                         ║
║  Tagline: [One-line hook]                                  ║
╠════════════════════════════════════════════════════════════╣
║  OVERVIEW                                                  ║
║  • Experience Type: [Treasure Hunt / Tour / Story / etc.]  ║
║  • Duration: [Estimated play time]                         ║
║  • Difficulty: [Easy / Medium / Hard / Progressive]        ║
║  • Players: [Single / Multiplayer / Competitive]           ║
╠════════════════════════════════════════════════════════════╣
║  STORY                                                     ║
║  [Narrative setup - why is the player here? What's at      ║
║  stake? What's the hook?]                                  ║
╠════════════════════════════════════════════════════════════╣
║  GAMEPLAY STRUCTURE                                        ║
║  Phase 1: [Description]                                    ║
║  Phase 2: [Description]                                    ║
║  Phase 3: [Description]                                    ║
╠════════════════════════════════════════════════════════════╣
║  VENUES                                                    ║
║  Venue 1: [Name, Location, Difficulty, Content]            ║
║  Venue 2: [Name, Location, Difficulty, Content]            ║
╠════════════════════════════════════════════════════════════╣
║  INTERACTIVE ELEMENTS                                      ║
║  • Collectibles: [What, how many, where hidden]            ║
║  • Triggers: [What actions cause what effects]             ║
║  • Objects: [Branded items, props, decorations]            ║
╠════════════════════════════════════════════════════════════╣
║  WIN CONDITION                                             ║
║  [How does the experience end? What triggers completion?]  ║
╠════════════════════════════════════════════════════════════╣
║  REWARDS                                                   ║
║  • On completion: [What players get]                       ║
║  • Grand prize: [If applicable]                            ║
║  • Social: [Shareable achievements, leaderboards]          ║
╠════════════════════════════════════════════════════════════╣
║  TECHNICAL REQUIREMENTS                                    ║
║  • Video capture: [Status, requirements]                   ║
║  • Scenes: [Count, complexity]                             ║
║  • Custom objects: [Any uploads needed]                    ║
║  • Integrations: [Payment, social, etc.]                   ║
╚════════════════════════════════════════════════════════════╝
```

#### 11.2 Example: Lost Masters Brief

```
╔════════════════════════════════════════════════════════════╗
║  THE LOST MASTERS                                          ║
║  Tagline: "The music is still out there. Can you find it   ║
║  before it's lost forever?"                                ║
╠════════════════════════════════════════════════════════════╣
║  OVERVIEW                                                  ║
║  • Experience Type: Treasure Hunt                          ║
║  • Duration: 1-3 hours                                     ║
║  • Difficulty: Progressive (Easy → Medium → Hard)          ║
║  • Players: Single player, competitive element (prizes)    ║
╠════════════════════════════════════════════════════════════╣
║  STORY                                                     ║
║  Country music legend Zac Brown is releasing a 20th        ║
║  Anniversary Edition of "You Get What You Give" but the    ║
║  original master recordings have vanished. The tapes were  ║
║  stolen during a 2003 tour and hidden across venues.       ║
║  Fans have 30 days to find all 12 tracks.                  ║
╠════════════════════════════════════════════════════════════╣
║  GAMEPLAY STRUCTURE                                        ║
║  Phase 1: Choose mission (see album, missing tracks)       ║
║  Phase 2: Explore venues in 3D                             ║
║  Phase 3: Find tapes (4 per venue × 3 venues = 12)         ║
║  Phase 4: Unlock content (song + studio commentary)        ║
║  Phase 5: Complete album, unlock bonus content             ║
╠════════════════════════════════════════════════════════════╣
║  VENUES                                                    ║
║  1. Buckhead Saloon (Atlanta) - Easy - Tracks 1-4          ║
║  2. Red Rocks Amphitheatre (CO) - Medium - Tracks 5-8      ║
║  3. Ryman Auditorium (Nashville) - Hard - Tracks 9-12      ║
╠════════════════════════════════════════════════════════════╣
║  INTERACTIVE ELEMENTS                                      ║
║  • Collectibles: 12 master tapes, hidden as objects        ║
║  • Hiding spots: stage equipment, lockers, bar stools,     ║
║    lighting rigs, storage closets                          ║
║  • Audio triggers: Each tape plays song + commentary       ║
╠════════════════════════════════════════════════════════════╣
║  WIN CONDITION                                             ║
║  Find all 12 master tapes across 3 venues                  ║
║  Album cover assembles piece by piece as progress made     ║
╠════════════════════════════════════════════════════════════╣
║  REWARDS                                                   ║
║  • Completion: Digital album, unreleased 13th track,       ║
║    virtual backstage pass, 20% merch code, completion cert ║
║  • Grand prize: $10K VIP concert experience (1 winner)     ║
╠════════════════════════════════════════════════════════════╣
║  TECHNICAL REQUIREMENTS                                    ║
║  • Video capture: 3 venues need scanning                   ║
║  • Scenes: 3 (one per venue)                               ║
║  • Custom objects: Master tape 3D model                    ║
║  • Audio: 13 tracks + 12 commentary clips                  ║
║  • Integrations: Prize draw system, completion tracking    ║
╚════════════════════════════════════════════════════════════╝
```

---

### 12. Handoff to Build Pipeline

Once the brief is finalized and approved, the AI transitions from discovery mode to execution mode.

#### 12.1 Handoff Moment

> "Your project brief is locked in. Here's what happens next: I'll break this down into tasks, guide you through each step, and handle the technical work. You'll need to provide venue footage and approve decisions along the way. Ready to start building?"

#### 12.2 Task Generation

The AI generates a task list based on the brief:

1. **Venue Capture** - For each venue: capture footage or confirm existing footage
2. **Scene Processing** - Upload videos → Process to 3D via CLI
3. **Object Setup** - Select from library or upload custom objects
4. **Object Placement** - Drag-drop objects into 3D scene
5. **Interaction Logic** - Define triggers, collisions, behaviors
6. **Game Logic** - Configure win conditions, progression, scoring
7. **Audio/Visual Assets** - Add sounds, effects, UI elements
8. **Testing** - Walk through experience, verify all interactions
9. **Publishing** - Package and deploy to Game View Platform

#### 12.3 AI Role Shift

| Spark Phase (Consultant) | Build Phase (PM + Dev) |
|--------------------------|------------------------|
| Asks open-ended questions | Gives specific instructions |
| Explores possibilities | Executes defined plan |
| Helps shape vision | Delivers on vision |
| Creator leads | AI leads, creator approves |

---

### 13. UI Components

#### 13.1 Entry Screen
- Central prompt: "What do you want people to experience?"
- Large text input area (multi-line)
- Upload button for documents
- Subtle examples below input
- Clean, uncluttered design - focus on the question

#### 13.2 Conversation Interface
- AI messages styled distinctly from creator messages
- Creator can type or use suggested response buttons
- Progress indicator ("3 of 5 sections complete")
- Ability to go back and revise previous answers
- "I'm not sure" option that triggers AI suggestions

#### 13.3 Brief Review Screen
- Full brief displayed in readable format
- Sections collapsible/expandable
- Edit buttons next to each section
- "Looks good, let's build!" primary action
- "I want to change something" secondary action
- Export/download brief as PDF option

#### 13.4 Persistent AI Chat
- Collapsible chat panel (sidebar or bottom drawer)
- Always accessible but not intrusive
- Shows current task and next steps
- Creator can ask questions or request changes
- AI can push notifications ("Ready for your review")

---

### 14. Edge Cases & Error Handling

#### 14.1 Creator Wants Something Outside Pipeline

> "Game View is built around bringing real spaces into interactive experiences. For what you're describing — a fully animated fantasy world — tools like Godot or Unity might be a better fit. Would you like to explore how you could incorporate a real venue into your concept? Many creators find that grounding fantasy in real locations makes the experience more powerful."

#### 14.2 Creator Gets Stuck

> "No worries — let's come back to that. Here are some options other creators have used: [suggestions]. Or we can leave this open and figure it out during the build. What feels right?"

#### 14.3 Creator Wants to Start Over

**Early in process (< 50% complete):** Allow clean restart with simple confirmation:

> "No problem — let's start fresh. What do you want people to experience?"

**Significant progress (≥ 50% complete):** Understand the WHY before allowing restart:

> "You've made real progress on [Project Name] — we've completed [X, Y, Z]. Before we start fresh, help me understand: Are you frustrated with how something's going, or has your vision fundamentally changed?"

| Reason | AI Response |
|--------|-------------|
| Frustrated with execution | "Let's fix what's not working instead of losing your progress. What's bothering you?" |
| Vision fundamentally changed | "Got it. Let's save [Project Name] as a draft and start a new project. You can always come back to it later." |
| Insists on starting over | "Understood. I'll archive [Project Name] — it'll be in your drafts if you ever want to revisit. Starting fresh now..." |

**Key principles:** Never delete without confirmation. Always offer to save/archive. Try to understand the WHY first. Projects are "archived" not "deleted" (always recoverable).

#### 14.4 Creator Abandons Mid-Flow

Save progress automatically. When they return:

> "Welcome back! You were working on [project name]. Last time we defined [summary]. Want to pick up where we left off, or start something new?"

#### 14.5 Brief Changes After Approval

Allow revisions, but communicate impact:

> "I can update the brief to add a fourth venue. This will add tasks to the project — specifically video capture and scene processing. The other work we've done stays intact. Sound good?"

---

### 15. Example Conversations

#### 15.1 Type A: Detailed Input (Lost Masters-style)

**Creator:** [Uploads 3-page concept document]

**AI:** This is a well-developed concept! Let me confirm I understand:
- Treasure hunt format across 3 music venues
- 12 collectible master tapes, 4 per venue
- Each tape unlocks a song plus exclusive commentary
- 30-day time limit with prize incentive
- Progressive difficulty (Easy → Medium → Hard)

A few questions to finalize:
1. Do you have access to these specific venues for filming, or are these placeholders?
2. For the audio content — do you have the tracks and commentary ready, or is that still being produced?
3. The $10K grand prize — is that confirmed? We'll need to set up the entry/draw system accordingly.

**Creator:** 1) We have access to Ryman, working on the others. 2) Tracks ready, commentary being recorded. 3) Yes, $10K confirmed.

**AI:** Perfect. I'm generating your project brief now...

#### 15.2 Type C: Vague Input

**Creator:** I want fans to explore my concert venue and find hidden stuff

**AI:** Love it — an exploration experience with hidden discoveries. That's exactly what Game View is great at. Let me ask a few things:

First, what venue are we talking about? Is this a place you perform regularly, or somewhere special?

**Creator:** It's the club where I got my start - The Blue Moon in Austin

**AI:** The Blue Moon — that's meaningful. There's a story there. Do you want fans to know that story, or just explore the space?

**Creator:** Definitely want them to know. This place made me who I am.

**AI:** So the venue itself is part of the narrative. Now, what are they finding? Some ideas:
- Physical mementos (old setlists, photos, gear)
- Audio clips (stories about the venue, early recordings)
- Unlockable content (unreleased music, videos)

What resonates?

**Creator:** All of it honestly. Can we do all three?

**AI:** Absolutely. Let's map out what you have: Do you have physical items you could photograph/scan? Old recordings? Stories you'd want to share via audio?

[Conversation continues until brief is complete...]

---

### 16. Success Metrics

#### 16.1 Conversation Quality
- **Average turns to complete brief:** Target < 15
- **Creator drop-off rate during conversation:** Target < 20%
- **Brief revision requests after initial generation:** Target < 2

#### 16.2 Creator Satisfaction
- **Post-brief survey:** "Did the AI understand your vision?" Target > 90% yes
- **"How much of the final brief reflects YOUR ideas vs AI suggestions?"** Target > 70% creator

#### 16.3 Pipeline Alignment
- **Briefs requiring manual intervention:** Target < 5%
- **Briefs that hit all pipeline stages without modification:** Target > 80%

#### 16.4 Time to Value
- **Time from first input to approved brief:** Target < 30 minutes
- **Time from approved brief to first playable scene:** Target < 2 hours

---

## PART 3: BUILD PIPELINE

### 17. Build Pipeline Overview

The Build Pipeline is where the creator's brief becomes a real, playable experience. The AI (Claude) transitions from consultant to project manager, guiding the creator through each stage.

#### 17.1 Pipeline Stages

| Stage | Input | Output | Status |
|-------|-------|--------|--------|
| 1. Video Upload | Raw video files | Uploaded, validated footage | Building |
| 2. 3D Rendering | Video footage | Gaussian Splat 3D scene | CLI exists |
| 3. Scene Viewer | Processed scene | Viewable, navigable 3D environment | Building |
| 4. Object Library | — | Available 3D objects to place | Building |
| 5. Object Placement | Objects + Scene | Objects positioned in 3D space | Building |
| 6. Interaction Setup | Placed objects | Triggers, collisions, behaviors defined | Building |
| 7. Game Logic | Interactions | Win conditions, scoring, progression | Building |
| 8. Testing | Complete experience | Verified, working experience | Building |
| 9. Publishing | Tested experience | Live on Game View Platform | Building |

#### 17.2 Object Library

**MVP Sources:**

**Pre-loaded Library** - Ships with Game View
- Common objects (furniture, props, decorations)
- Collectible templates (coins, gems, tapes, keys)
- Interactive objects (doors, switches, containers)
- Category organization and search

**User Uploads** - Creator brings their own
- Supported formats: .glb, .gltf
- Upload, preview, and place workflow
- Saved to creator's personal library

**Future:**
- AI-generated objects (describe it, AI makes it)
- Third-party integrations (Sketchfab, etc.)

#### 17.3 Interaction Types

| Interaction | Description | Example |
|-------------|-------------|---------|
| Proximity Trigger | Player gets close to object | "When near tape, show glow effect" |
| Click/Touch | Player interacts with object | "When clicked, play audio clip" |
| Collision | Player touches object | "When touched, add to inventory" |
| Collect | Player picks up object | "When collected, increment score" |
| Unlock | Condition met, content available | "When all tapes found, unlock bonus" |

#### 17.4 Game Logic Components

| Component | Description | Configuration |
|-----------|-------------|---------------|
| Inventory | Track collected items | What items, max count, display |
| Score | Track points | Point values, display, leaderboard |
| Progress | Track completion | Checkpoints, percentage, save state |
| Time | Track duration | Time limit, countdown, elapsed |
| Win Condition | End state | What triggers completion |
| Rewards | Completion rewards | What player receives |

---

### 18. Testing Mode

Before publishing, creators can test their experience:

#### 18.1 Testing Features
- Full play-through as a player would experience
- Debug overlay showing triggers and collisions
- Teleport to any location
- Reset to beginning
- Test individual interactions
- Verify win condition triggers

#### 18.2 Testing Checklist (AI-generated)

Based on the brief, AI generates a testing checklist:
- [ ] All venues load correctly
- [ ] All collectibles are findable
- [ ] All interactions work as expected
- [ ] Win condition triggers properly
- [ ] Rewards are granted on completion
- [ ] Audio plays correctly
- [ ] No visual glitches or clipping

---

## PART 4: PLATFORM

### 19. Game View Platform Overview

The Game View Platform is where players discover and play experiences created by creators. Think "Steam meets YouTube for 3D experiences."

#### 19.1 Platform Components

| Component | Description |
|-----------|-------------|
| Home/Discovery | Featured experiences, categories, trending |
| Search | Find experiences by name, creator, type |
| Experience Page | Details, screenshots, play button, creator info |
| Player | The actual play experience (web-based) |
| Profile | Player's history, achievements, saved progress |
| Analytics | Creator dashboard with engagement metrics |

#### 19.2 Experience Categories
- Treasure Hunts
- Virtual Tours
- Interactive Stories
- Competitions
- Brand Experiences
- Featured / Staff Picks
- New Releases
- Popular

#### 19.3 Player Payments

Creators can optionally charge players:

| Model | Description |
|-------|-------------|
| Free | Anyone can play |
| Paid | One-time payment to access |
| Ticket | Time-limited access (e.g., 30 days) |
| Competition Entry | Pay to enter prize competition |

#### 19.4 Analytics Dashboard

Creators see:
- Total plays
- Unique players
- Completion rate
- Average play time
- Drop-off points
- Revenue (if paid)
- Geographic distribution

---

## APPENDICES

### Appendix A: User Profile / Onboarding Flow

The User Profile is collected at signup (required) and informs all AI interactions during project creation.

#### A.1 Profile Fields (Required)

| Field | Format | Why We Need It |
|-------|--------|----------------|
| What do you do? | Selector: Musician/Artist, Content Creator, Brand/Agency, Sports/Entertainment, Venue/Events, Other | Frames all AI communication in familiar terms |
| Experience level | Selector: New to this, Some experience, Professional | Calibrates technical language complexity |
| Creation goals | Multi-select: Fan experiences, Virtual tours, Treasure hunts, Branded content, Still exploring | Helps AI suggest relevant examples and templates |
| Venue footage | Selector: Yes I have footage, No not yet, I need guidance on capture | Determines if project starts with capture planning or processing |

#### A.2 Profile Fields (Optional)
- Display name
- Social links
- Team size
- How did you hear about us?

#### A.3 How Profile Informs AI

| Profile Data | AI Adaptation |
|--------------|---------------|
| Musician/Artist | Uses terms like "setlist," "encore," "green room." Suggests audio-focused collectibles. |
| Content Creator | Uses terms like "audience," "engagement," "content." Assumes video skills. |
| Brand/Agency | Uses terms like "campaign," "activation," "ROI." Asks about brand guidelines. |
| Sports/Entertainment | Uses terms like "fans," "venue," "season." Suggests competition formats. |
| New to this | Explains concepts simply. Avoids jargon. Offers more guidance. |
| Professional | Uses industry terminology freely. Moves faster. |

---

### Appendix B: Supported Experience Types

| Type | Description | Key Features |
|------|-------------|--------------|
| Treasure Hunt | Find hidden items, unlock rewards | Collectibles, inventory, win condition |
| Virtual Tour | Explore space with informational hotspots | Info triggers, navigation, audio guides |
| Interactive Story | Narrative-driven exploration | Story beats, character interactions, branching |
| Competition | Time-limited challenges with prizes | Leaderboards, time limits, prize pools |
| Brand Experience | Sponsored content, product placement | Branded objects, product interactions, CTAs |

---

### Appendix C: Test Cases

The following experiences validate the platform:

#### C.1 Lost Masters
- **Type:** Treasure Hunt
- **Venues:** 3 (Buckhead Saloon, Red Rocks, Ryman)
- **Collectibles:** 12 master tapes
- **Difficulty:** Progressive
- **Prize:** $10K grand prize
- **Validates:** Multi-venue, collectibles, audio triggers, prize pool, competition

#### C.2 Legends Jam
- **Type:** Competition
- **Format:** Music competition, seasonal
- **Features:** Voting, $10M treasure hunt tie-in
- **Validates:** Competition mechanics, voting, large prize pools, seasonal content

#### C.3 Legends Wild
- **Type:** Competition
- **Format:** Outdoor competition
- **Features:** User-submitted content, leaderboards, $100K+ prizes
- **Validates:** User-generated content, leaderboards, ongoing competitions

---

### Appendix D: Technical Architecture

#### D.1 Core Technologies
- **CLI:** Gaussian Splat processing (video → 3D)
- **AI:** Claude API for Spark and build assistance
- **3D Viewer:** WebGL-based scene renderer
- **Platform:** Web-based (cross-platform)

#### D.2 Data Model (High-Level)
- **Creator:** Profile, subscription, projects
- **Project:** Brief, scenes, objects, interactions, logic
- **Scene:** 3D environment, placed objects, triggers
- **Experience:** Published project, analytics, payments
- **Player:** Profile, history, achievements, progress

---

### Appendix E: Glossary

| Term | Definition |
|------|------------|
| Spark | The AI-powered project brief chat flow |
| Brief | Structured project specification generated by Spark |
| Scene | A single 3D environment processed from video |
| Experience | A complete, published project playable by players |
| Game View Platform | The marketplace where experiences are published and discovered |
| Gaussian Splat | The 3D rendering technology that converts video to explorable 3D |

---

### Appendix F: Future Innovations (Post-Beta)

Three innovations identified for future iterations:

| Innovation | What It Enables | Impact |
|------------|-----------------|--------|
| iPhone LiDAR Capture | 2-minute scan, no special hardware | Anyone can capture |
| Serverless GPU ($0.30) | Infinite scale, no infrastructure | Sustainable economics |
| WebGPU Browser Viewer | Click link, explore in 60 FPS | Frictionless sharing |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial document (Spark flow only) |
| 1.1 | Dec 2024 | Added User Profile, Sandbox mode, smarter start-over |
| 1.2 | Dec 2024 | Added Vision & Strategy, Target Customers, CTQ criteria, Business Infrastructure, Build Pipeline overview, Platform overview, full appendices, Future Innovations |
