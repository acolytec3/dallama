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

# Key Challenges and Analysis
- Vosk's official Node.js bindings (as in `src/vosk.ts`) are not browser-compatible; we must use a WASM build (e.g., vosk-browser).
- Loading Vosk models in the browser requires handling large assets and async initialization.
- Real-time audio capture and streaming to the recognizer must be handled efficiently and in a mobile-friendly way.
- UI must be touch-friendly and accessible.
- The app must work offline after initial load (PWA support).

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
- [ ] Add PWA support for offline use
- [ ] Test and polish

# Executor's Feedback or Assistance Requests
- Chakra UI and emotion have been upgraded to v3 as per migration guide. Layout in App.tsx now uses 'gap' prop for Stack, resolving previous linter/type errors. Ready to proceed with vosk-browser integration and component implementation.
- vosk-browser is installed and the small English model (vosk-model-small-en-us-0.15) is downloaded and extracted to public/model/. Ready for client-side WASM STT integration.
- ModelLoader component is implemented and integrated into the app. Model loads and triggers onReady callback. Ready to proceed with MicRecorder implementation.
- MicRecorder component is implemented, handles mic permissions, recording, and errors. Linter/type errors fixed for Chakra v3. Ready to proceed with vosk-browser recognizer integration.
- MicRecorder is now integrated into the main app. Audio buffer is received and ready for vosk-browser recognizer integration.
- vosk-browser recognizer is now integrated. Audio is transcribed in-browser and transcript is displayed. Used linter suppression for dynamic model type as vosk-browser does not provide TypeScript types for model/recognizer.
- Fixed Chakra UI v3 provider setup: installed @chakra-ui/cli snippets, updated main.tsx to use Provider from snippets, added vite-tsconfig-paths, and configured tsconfig.app.json with proper paths. This resolves the '_config' error.
- Fixed Vosk model corruption issue: re-downloaded the model from the official source (alphacephei.com) and verified the archive integrity. The model is now properly extracted and ready for use.
- Corrected Vosk model format: vosk-browser expects the model to remain in tar.gz format, not extracted. Updated ModelLoader to use the correct path to the tar.gz file.
- Fixed recognizer configuration error: resolved "Cannot convert undefined to float" by properly passing sample rate (16000) to KaldiRecognizer constructor and ensuring audio format matches Vosk requirements (16kHz mono PCM).
- Added audio playback and debugging features: users can now play back the converted audio to verify recording quality, and detailed debug information is displayed to help troubleshoot recognition issues.
- **FIXED CRITICAL BUG**: Resolved "buffer.getChannelData is not a function" error by changing the audio pipeline to pass AudioBuffer objects directly to vosk-browser's acceptWaveform method instead of converting to PCM ArrayBuffer. Updated both MicRecorder and App components to handle AudioBuffer correctly and set up proper event listeners for recognition results.
- **COMPLETED MOBILE-FRIENDLY UI**: Implemented comprehensive mobile-friendly improvements including: responsive design with proper breakpoints, improved color contrast (gray.800 for text, better error styling), larger touch-friendly buttons (60px height on mobile, 200px width), rounded button design with hover effects, better spacing and typography scaling, proper error message styling with background colors, and responsive layout that prevents horizontal overflow. All components now follow mobile-first design principles.

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