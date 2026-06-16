# AGENTS.md — Change Log

## Project: Al Mujati Portfolio (almujati.github.io)

Dual-theme portfolio: **Cyber Edition** + **Vista Edition** with a theme selector at root.

---

### Session 1 — Initial Build
- Moved existing cyber portfolio into `cyber/` folder with all assets (images, CV files)
- Created root `index.html` as dual-theme selector (Cyber + Vista cards)
- Built `vista/index.html` — full Windows Vista desktop simulation:
  - Boot sequence (Vista logo, green loading bar, fade to desktop)
  - Aurora wallpaper via CSS/SVG gradients
  - Aero Glass windows (draggable, resizable, minimize/maximize/close)
  - Desktop icons: My Portfolio, Projects, Skills, Contact, GitHub, Recycle Bin
  - Taskbar with Start orb, open window pills, system tray + clock
  - Start Menu with left/right columns, search bar, power button
  - Right-click context menu on desktop (Refresh, Change Theme, View Source, Properties)
  - Recycle Bin easter egg with right-click context actions
  - Cross-theme "Switch Theme" navigation buttons
- Added favicons to all pages (root, cyber, vista)
- Created README.md documenting both themes

### Session 2 — Polish & Fixes
- Fixed boot sequence (DOMContentLoaded → direct setTimeout call)
- Replaced invalid Google Fonts Segoe UI with Inter
- Removed auto-redirect loop from theme selector
- Fixed CSS custom properties used in inline styles (replaced with concrete values)
- Added Switch Theme buttons: Vista-style on Cyber page, Cyber-style on Vista page
- Positioned switch buttons top-left with auto-hide after 4s, reappear on scroll to top
- Updated theme selector tagline: "Same guy, two vibes. Pick the world that fits how you see it."
- Updated card descriptions (Option A copy)
- Replaced cyber subtitle from "v2.0 // NEURAL INTERFACE" to "ELECTRIC UNFILTERED"

### Session 3 — Project Reorder & Real Logo
- Reordered projects: SewAndGrow moved to position #2 (after CarIQ) in both themes
- Updated Vista projects array to match Cyber projects lineup
- Added real Windows Vista logo images to boot screen (uploaded by user)

### Session 4 — Interactive Elements
- Made Start Menu search bar functional: filters sm-item elements in real time
- Made volume icon (🔊) interactive: shows volume slider popup with percentage
- Made network icon (📶) interactive: shows Wi-Fi status popup with connection info
- Made power button (⏻) functional: shows "Shutting down..." overlay animation, then redirects to theme selector
- Both tray popups close on outside click
- Fixed project button labels: "View on GitHub →" for GitHub URLs, "Visit Site →" for external URLs, hidden for '#'

---

## File Structure
```
almujati.github.io/
├── index.html                     # Theme selector
├── AGENTS.md                      # This file
├── README.md                      # Project docs
├── cyber/
│   ├── index.html                 # Cyber portfolio
│   ├── chatsystem.jpg
│   ├── image_2025-10-30_123547581.png
│   ├── upscaled_image.jpg
│   ├── Weather.jpg
│   ├── Al_Mujati_Master_Portfolio_CV.docx
│   └── Al_Mujati_Master_Portfolio_CV.pdf
├── vista/
│   ├── index.html                 # Vista desktop portfolio
│   ├── windows-vista-logo.jpg
│   └── windows-vista-logo-png_seeklogo-153146.png
└── my-starting-projects/          # Legacy prototypes (unchanged)
```
