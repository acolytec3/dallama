# Scratchpad: Vosk STT Mobile Web App (React + Chakra + Vite)

## Project Overview
A mobile-friendly, browser-based speech-to-text (STT) web app using Vosk WebAssembly (WASM), React, Chakra UI, and Vite. The app will run all STT in-browser, support offline/PWA mode, and provide a modern, accessible UI.

---

## Roadmap & Phases

### Phase 1: Project Initialization & Setup
- [ ] Scaffold Vite + React + TypeScript project
- [ ] Install Chakra UI and configure provider
- [ ] Install vosk-browser and add a small Vosk model to `public/`
- [ ] Set up Vite PWA plugin
- [ ] Initialize Git and .cursor/ structure

### Phase 2: Core STT Functionality
- [ ] Integrate vosk-browser for WASM STT
- [ ] Implement ModelLoader component (loads WASM/model, shows progress)
- [ ] Implement MicRecorder component (mic permissions, audio capture, push-to-talk UI)
- [ ] Implement TranscriptDisplay (live/final transcript, copy/share)
- [ ] Wire up audio pipeline: mic → recognizer → transcript

### Phase 3: UI/UX & Accessibility
- [ ] Use Chakra UI for responsive, mobile-friendly layout
- [ ] Add dark mode support (Chakra color mode)
- [ ] Implement accessible controls (aria-labels, keyboard nav, etc.)
- [ ] Add settings drawer (language/model selection, theme)

### Phase 4: PWA & Offline Support
- [ ] Configure Vite PWA plugin for offline installability
- [ ] Cache WASM/model files for offline use
- [ ] Test installability and offline behavior on mobile

### Phase 5: Polish & Optional Features
- [ ] Add transcript export (copy/share/download)
- [ ] (Optional) Integrate LLM/chat API for transcript-based chat
- [ ] Add onboarding/help screens
- [ ] Final QA and accessibility audit

---

## Modular Structure

- `src/components/`
  - `AppShell.tsx` — Layout, navigation, theme, PWA install prompt
  - `ModelLoader.tsx` — Loads Vosk WASM/model, shows progress
  - `MicRecorder.tsx` — Handles mic permissions, audio capture, push-to-talk UI
  - `TranscriptDisplay.tsx` — Shows transcript, copy/share actions
  - `Settings.tsx` — Language/model selection, theme, privacy info
- `src/voskWorker.ts` — (if using a custom worker for Vosk)
- `public/model.tar.gz` — Vosk model file

---

## Task Tracking
- Each phase will be tracked as a checklist
- Unique task IDs and dependencies will be added as needed
- Status will be updated in real-time as development progresses

---

## Version
[v1.0.0] Initial project plan and roadmap defined

---

# Background and Motivation
The goal is to build a mobile-friendly web app using Vite, React, TypeScript, and Chakra UI that performs speech-to-text transcription entirely on the client side using Vosk. The app should have a simple UI: a record button and a transcript display. The implementation should reference the logic in `src/vosk.ts`, which currently demonstrates server-side Vosk usage, and adapt it for browser-based, client-side operation.

**NEW FEATURE REQUEST**: Integrate the Vosk STT app with the LLM server running in `src/vosk.ts`. The app should send transcribed text to the LLM server, receive the LLM's response, and display it in the app. This creates a complete voice-to-LLM conversation flow where users can speak, get their speech transcribed, and receive AI responses.

# Key Challenges and Analysis
- Vosk's official Node.js bindings (as in `src/vosk.ts`) are not browser-compatible; we must use a WASM build (e.g., vosk-browser).
- Loading Vosk models in the browser requires handling large assets and async initialization.
- Real-time audio capture and streaming to the recognizer must be handled efficiently and in a mobile-friendly way.
- UI must be touch-friendly and accessible.
- The app must work offline after initial load (PWA support).
- **LLM INTEGRATION CHALLENGES**:
  - The LLM server in `src/vosk.ts` runs on port 3000 and expects POST requests to `/transcribe`
  - Need to establish HTTP communication between the React app and the Node.js server
  - Handle CORS issues between frontend and backend
  - Manage loading states and error handling for LLM requests
  - Design UI to display both user transcript and LLM response
  - Handle conversation flow and context management

# High-level Task Breakdown
1. **Set up Vite + React + TypeScript + Chakra UI project**
   - Success: Project runs, Chakra UI is integrated, and a basic page renders.
2. **Upgrade Chakra UI to v3 and refactor layout to use 'gap' instead of 'spacing'**
   - Success: Chakra UI v3 is integrated and layout refactoring is complete.
3. **Add vosk-browser and download a small Vosk model**
   - Success: Model file is present in `public/` and can be fetched by the app.
4. **Implement ModelLoader component**
   - Loads WASM and model, shows progress/spinner.
   - Success: Model loads without error, UI updates when ready.
5. **Implement MicRecorder component**
   - Handles mic permissions, audio capture, and a record button.
   - Success: User can start/stop recording, and audio data is captured.
6. **Integrate vosk-browser recognizer**
   - Stream audio to recognizer, receive partial/final results.
   - Success: Recognizer returns transcript for spoken audio.
7. **Implement TranscriptDisplay component**
   - Shows live/final transcript, allows copy/share.
   - Success: Transcript is visible and updates as user speaks.
8. **Make UI mobile-friendly and accessible**
   - Use Chakra UI for layout, large touch targets, aria-labels, etc.
   - Success: App is usable on mobile and passes basic accessibility checks.
9. **Add PWA support for offline use**
   - Configure Vite PWA plugin, cache model/WASM files.
   - Success: App can be installed and works offline after first load.
10. **Test and polish**
   - Manual and automated tests for all features.
   - Success: All features work as intended, no major bugs.

**NEW TASK: LLM Integration**
11. **Analyze Current LLM Server Setup**
    - Review `src/vosk.ts` server implementation
    - Understand the `/transcribe` endpoint API
    - Identify data format requirements and response structure
    - Success: Clear understanding of server API and requirements.
12. **Configure CORS and Server Setup**
    - Update the LLM server to handle CORS for frontend requests
    - Ensure server accepts JSON requests instead of binary audio
    - Test server connectivity from frontend
    - Success: Server accepts requests from React app without CORS issues.
13. **Create LLM Service Layer**
    - Implement service to communicate with LLM server
    - Handle HTTP requests, responses, and error states
    - Add retry logic and timeout handling
    - Success: Reliable communication with LLM server.
14. **Update UI for Conversation Flow**
    - Design conversation interface showing user transcript and AI response
    - Add loading states for LLM requests
    - Implement conversation history display
    - Success: Clear conversation UI with proper loading states.
15. **Integrate LLM Communication**
    - Connect transcribed text to LLM service
    - Handle LLM responses and display in UI
    - Add error handling for failed LLM requests
    - Success: Complete voice-to-LLM conversation flow.
16. **Test and Optimize**
    - Test conversation flow end-to-end
    - Optimize response times and user experience
    - Add conversation management features
    - Success: Smooth, reliable voice-to-LLM conversation experience.

# Project Status Board
- [x] Set up Vite + React + TypeScript + Chakra UI project
- [x] Upgrade Chakra UI to v3 and refactor layout to use 'gap' instead of 'spacing'
- [x] Fix Chakra UI v3 provider setup (resolve '_config' error)
- [x] Add vosk-browser and download a small Vosk model
- [x] Fix Vosk model format (keep as tar.gz for vosk-browser)
- [x] Fix recognizer configuration (resolve "undefined to float" error)
- [x] Add audio playback and debugging features
- [x] Implement ModelLoader component
- [x] Implement MicRecorder component
- [x] Integrate MicRecorder into main app
- [x] Integrate vosk-browser recognizer
- [x] Implement TranscriptDisplay component (inline)
- [x] Make UI mobile-friendly and accessible
- [x] **COMPLETED: Dark Mode Implementation**
  - [x] Configure Chakra UI Color Mode System
  - [x] Design Dark Mode Color Palette
  - [x] Implement Dark Mode Button Styling
  - [x] Update All Components for Dark Mode
  - [x] Add Dark Mode Toggle
  - [ ] Test Dark Mode Accessibility
- [x] **COMPLETED: LLM Integration**
  - [x] Analyze Current LLM Server Setup
  - [x] Configure CORS and Server Setup
  - [x] Create LLM Service Layer
  - [x] Update UI for Conversation Flow
  - [x] Integrate LLM Communication
  - [🔄] Test and Optimize
- [ ] Add PWA support for offline use
- [ ] Test and polish

# LLM Integration Feature Specification

## Current System Analysis

### LLM Server (`src/vosk.ts`)
- **Port**: 3000
- **Endpoint**: `POST /transcribe`
- **Current Input**: Binary audio data (application/octet-stream)
- **Current Output**: JSON with LLM response
- **LLM Model**: Gemma-2-2b-it (via node-llama-cpp)
- **Vosk Model**: vosk-model-small-en-us-0.15

### Vosk STT App
- **Port**: 5173 (Vite dev server)
- **STT**: Client-side using vosk-browser WASM
- **Output**: Transcribed text from speech
- **UI**: React + Chakra UI with dark mode

## Integration Architecture

### Data Flow
1. **User speaks** → MicRecorder captures audio
2. **Audio processed** → Vosk-browser transcribes to text
3. **Text sent** → HTTP POST to LLM server
4. **LLM processes** → Generates response
5. **Response received** → Displayed in conversation UI

### API Design
**Endpoint**: `POST http://localhost:3000/transcribe`
**Request Format**:
```json
{
  "text": "User's transcribed speech",
  "conversationId": "optional-session-id"
}
```
**Response Format**:
```json
{
  "message": "LLM response text",
  "conversationId": "session-id"
}
```

## Technical Implementation Plan

### 1. Server Modifications Required
- **CORS Configuration**: Allow requests from `http://localhost:5173`
- **Content Type**: Accept `application/json` instead of `application/octet-stream`
- **Request Parsing**: Parse JSON body instead of binary audio
- **Response Format**: Return structured JSON response

### 2. Frontend Service Layer
- **LLM Service**: HTTP client for server communication
- **Error Handling**: Network errors, timeouts, server errors
- **Loading States**: Show loading indicators during LLM processing
- **Retry Logic**: Automatic retry for failed requests

### 3. UI Components
- **ConversationDisplay**: Show user transcript and AI response
- **LoadingIndicator**: Visual feedback during LLM processing
- **ErrorDisplay**: Show error messages for failed requests
- **ConversationHistory**: Maintain chat history

### 4. State Management
- **Conversation State**: Track user messages and AI responses
- **Loading State**: Track when LLM is processing
- **Error State**: Track and display errors
- **Session Management**: Optional conversation continuity

## Success Criteria
- [ ] User can speak and see their transcript
- [ ] Transcript is automatically sent to LLM server
- [ ] LLM response is displayed in conversation UI
- [ ] Loading states provide clear feedback
- [ ] Error handling gracefully manages failures
- [ ] Conversation flow feels natural and responsive
- [ ] UI works in both light and dark modes
- [ ] Mobile experience remains smooth and touch-friendly

## Potential Challenges
- **CORS Issues**: Cross-origin requests between ports
- **Network Latency**: LLM processing time may be slow
- **Error Recovery**: Handling server downtime gracefully
- **State Synchronization**: Keeping conversation state consistent
- **Performance**: Large LLM responses may impact UI responsiveness

# Executor's Feedback or Assistance Requests

### Latest Update (Current) - EXECUTOR MODE
**Issue Fixed**: Transcribed text was being duplicated twice in the conversation.

**Root Cause Identified**:
1. In `App.tsx`, the `partialresult` event handler calls both `updateCurrentMessage()` and `sendMessage()`
2. `updateCurrentMessage()` adds a user message to the conversation display
3. `sendMessage()` was ALSO adding a NEW user message to the conversation
4. This resulted in duplicate user messages appearing in the conversation

**Solution Implemented**:
1. **Modified `sendMessage` function** in `useConversation.ts`:
   - Removed the code that creates and adds a new user message
   - `sendMessage` now only handles LLM communication and adds AI responses
   - `updateCurrentMessage` remains responsible for adding/updating user messages
2. **Maintained the correct flow**:
   - `partialresult` events call `updateCurrentMessage()` to add/update user message
   - `partialresult` events also call `sendMessage()` to communicate with LLM
   - No duplication since only one function adds user messages

**Technical Changes**:
- Removed user message creation from `sendMessage` function
- `sendMessage` now only sets loading state and handles LLM communication
- `updateCurrentMessage` remains the sole function responsible for user message management
- Maintained all existing logging for debugging

**Status**: The duplication issue should now be resolved. Users will see their speech transcribed once in the conversation, and the LLM will receive the transcribed text for processing.

### Previous Issues Resolved
- Fixed Chakra UI v3 provider setup errors
- Resolved Vosk model format issues (kept as tar.gz)
- Fixed recognizer creation errors (explicit sample rate)
- Resolved audio format mismatches (16kHz mono PCM conversion)
- Fixed "Recognition Failed" errors
- Resolved ChakraProvider "_config" errors
- Implemented mobile-friendly UI with proper contrast
- Added dark mode support
- Integrated LLM server communication
- Fixed partial results not being sent to LLM
- Fixed Vosk punctuation issue and partial results handling

# Lessons
- Vosk Node.js bindings are not browser-compatible; use vosk-browser (WASM) for client-side.
- Always test model loading and audio capture on real mobile devices.
- Use 'gap' instead of 'spacing' for Stack in Chakra UI v3+.
- Chakra UI v3 Alert/AlertIcon are not available; use Text with color for errors.
- vosk-browser model/recognizer types are not available; use type assertion and linter suppression as needed.
- Chakra UI v3 requires using the Provider component from snippets instead of ChakraProvider directly.
- Vosk models can become corrupted during download; always verify archive integrity and re-download from official sources if needed.
- vosk-browser expects models to remain in tar.gz format; do not extract them to individual files.
- Vosk recognizer requires explicit sample rate parameter (16000) and expects 16kHz mono PCM audio format.
- Audio playback debugging is essential for troubleshooting speech recognition issues.
- **CRITICAL**: vosk-browser's acceptWaveform method expects an AudioBuffer object, not raw PCM data. Always pass the AudioBuffer directly from the Web Audio API.
- **CRITICAL**: vosk-browser uses event-based recognition results, not synchronous return values. Set up 'result' and 'partialresult' event listeners to receive transcription output.
- **MOBILE DESIGN**: Use responsive breakpoints (base/md) for different screen sizes, ensure buttons are at least 44px tall for touch accessibility, use proper color contrast (gray.800 for text on light backgrounds), implement proper spacing and typography scaling, and prevent horizontal overflow with maxW="100%" and overflowX="hidden".
- Include info useful for debugging in the program output.
- Read the file before you try to edit it.
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
- Always ask before using the -force git command.

---

# Planner's Review & Recommendations

## Summary of Progress
- The app is scaffolded with Vite, React, TypeScript, and Chakra UI v3.
- Chakra UI is fully integrated and up to date, using the latest API (e.g., 'gap' prop).
- vosk-browser is installed, and a small English model is available in the public directory.
- ModelLoader loads the WASM model and signals readiness.
- MicRecorder handles mic permissions, recording, and passes audio to the recognizer.
- Audio is transcribed in-browser using vosk-browser, and the transcript is displayed inline.
- Linter/type issues are handled with explicit comments and best practices for dynamic WASM libraries.
- The project status board and lessons are kept up to date after each step.

## Assessment
- The MVP (record, transcribe, display) is functionally complete and follows the plan.
- Code is modular, readable, and follows React/Chakra UI conventions.
- All major technical risks (WASM, model loading, mic, recognizer) are addressed.
- Project management and documentation are clear and up to date.

## Recommendations / Next Steps
1. **UI/UX Improvements**
   - Add a dedicated TranscriptDisplay component for better separation of concerns and future extensibility.
   - Improve mobile responsiveness: ensure all controls are touch-friendly, use Chakra's responsive props, and test on real devices.
   - Add visual feedback for model loading, recording, and errors (e.g., progress bars, toasts).
   - Consider adding a clear/reset button for the transcript.
2. **Accessibility**
   - Ensure all interactive elements are accessible (ARIA labels, keyboard navigation, color contrast).
   - Add focus management for modal/dialogs if used in the future.
3. **Performance & Robustness**
   - Handle edge cases: long recordings, multiple recordings in a row, mic permission changes.
   - Add error boundaries or fallback UI for WASM/model load failures.
4. **Testing**
   - Add unit and integration tests for components (ModelLoader, MicRecorder, TranscriptDisplay).
   - Test on a variety of browsers and mobile devices.
5. **PWA & Offline Support**
   - Implement Vite PWA plugin configuration for installability and offline use.
   - Test model caching and offline transcription.
6. **Documentation**
   - Update README with usage instructions, browser support, and troubleshooting tips.
   - Add in-app help or tooltips for first-time users.

## Optional Enhancements
- Support for multiple languages (allow user to select/download different models).
- Streaming/partial transcription (show partial results as user speaks).
- Export transcript (copy, download as .txt, share).
- Voice activity detection (auto start/stop recording).

---

**Conclusion:**
The project is on track, the MVP is robust, and the codebase is well-structured. The next phase should focus on polish, accessibility, and user experience improvements, as well as adding PWA/offline support and tests. No major architectural changes are needed at this time.

---

# End of Scratchpad 

## Current Status / Progress Tracking

### ✅ Completed Tasks
- [x] Project scaffolding with Vite, React, TypeScript, and Chakra UI
- [x] Upgraded Chakra UI to v3 and fixed provider setup
- [x] Integrated vosk-browser WASM library
- [x] Downloaded and configured small English Vosk model
- [x] Implemented core components: ModelLoader, MicRecorder, ConversationDisplay
- [x] Fixed audio format issues (converting to 16kHz mono PCM)
- [x] Added mobile-friendly UI with responsive design
- [x] Implemented dark mode with custom theme
- [x] Integrated with LLM server running in `src/vosk.ts`
- [x] Added real-time partial transcript display
- [x] Fixed transcribed text appearing separately instead of in conversation
- [x] Implemented automatic sending of complete sentences to LLM

### 🔄 Current Task
- [ ] Testing and validation of voice-to-LLM pipeline

### 📋 Next Steps
- [ ] User testing and feedback collection
- [ ] Performance optimization if needed
- [ ] Additional features (conversation history, export, etc.)

## Executor's Feedback or Assistance Requests

### Latest Update (Current) - EXECUTOR MODE
**Issue Fixed**: Transcribed text was being duplicated twice in the conversation.

**Root Cause Identified**:
1. In `App.tsx`, the `partialresult` event handler calls both `updateCurrentMessage()` and `sendMessage()`
2. `updateCurrentMessage()` adds a user message to the conversation display
3. `sendMessage()` was ALSO adding a NEW user message to the conversation
4. This resulted in duplicate user messages appearing in the conversation

**Solution Implemented**:
1. **Modified `sendMessage` function** in `useConversation.ts`:
   - Removed the code that creates and adds a new user message
   - `sendMessage` now only handles LLM communication and adds AI responses
   - `updateCurrentMessage` remains responsible for adding/updating user messages
2. **Maintained the correct flow**:
   - `partialresult` events call `updateCurrentMessage()` to add/update user message
   - `partialresult` events also call `sendMessage()` to communicate with LLM
   - No duplication since only one function adds user messages

**Technical Changes**:
- Removed user message creation from `sendMessage` function
- `sendMessage` now only sets loading state and handles LLM communication
- `updateCurrentMessage` remains the sole function responsible for user message management
- Maintained all existing logging for debugging

**Status**: The duplication issue should now be resolved. Users will see their speech transcribed once in the conversation, and the LLM will receive the transcribed text for processing.

### Previous Issues Resolved
- Fixed Chakra UI v3 provider setup errors
- Resolved Vosk model format issues (kept as tar.gz)
- Fixed recognizer creation errors (explicit sample rate)
- Resolved audio format mismatches (16kHz mono PCM conversion)
- Fixed "Recognition Failed" errors
- Resolved ChakraProvider "_config" errors
- Implemented mobile-friendly UI with proper contrast
- Added dark mode support
- Integrated LLM server communication
- Fixed partial results not being sent to LLM
- Fixed Vosk punctuation issue and partial results handling

## Lessons

- Include info useful for debugging in the program output.
- Read the file before you try to edit it.
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
- Always ask before using the -force git command
- Vosk speech recognition models don't add punctuation by default
- Manual recording control means we only get partial results, not final results with punctuation
- Send partial results immediately to LLM for real-time conversation flow 