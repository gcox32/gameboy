  Current State                           
                                                                                                                                                                                                            
  - StarfieldContainer wraps the home page — it's a full-viewport div with 8 CSS-animated star layers and a dark blue gradient background                                                                   
  - kanto_route_4_anime.png is 960×720px and lives in public/images/ but is not used anywhere yet                                                                                                           
  - No time-of-day logic exists                                                                                                                                                                             
                                                                                                                                                                                                            
  ---                                                                                                                                                                                                       
  The Core Challenge                                                                                                                                                                                        
                                                                                                                                                                                                            
  The route 4 image has a static sky baked into the top portion of the PNG. To make the sky dynamic, you have two paths:
                                                                                                                                                                                                            
  ---             
  Path A — Export the PNG with a transparent sky (recommended)                                                                                                                                              
                                                                                                                                                                                                            
  Edit the image in GIMP/Photoshop/Photopea to remove the sky pixels (make them transparent), saving as a new PNG (e.g. kanto_route_4_no_sky.png).
                                                                                                                                                                                                            
  Then the layering becomes clean and simple:                                                                                                                                                               
                                                                                                                                                                                                            
  [full viewport]                                                                                                                                                                                           
  ├── Layer 1 (z: 0)  — Dynamic sky component (fills entire bg)
  ├── Layer 2 (z: 1)  — kanto_route_4_no_sky.png (transparent sky, terrain shows through)                                                                                                                   
  ├── Layer 3 (z: 2)  — Scanlines overlay (optional)                                                                                                                                                        
  └── Layer 4 (z: 3)  — Page content (title, buttons)                                                                                                                                                       
                                                                                                                                                                                                            
  The sky layer behind the PNG is fully visible through the transparent sky region. Clean, no math needed.                                                                                                  
                                                                                                                                                                                                                  
  Sky Periods to Build
                                                                                                                                                                                                            
  ┌───────────┬─────────────┬───────────────────────────────────────────┐
  │  Period   │    Hours    │                  Visual                   │                                                                                                                                   
  ├───────────┼─────────────┼───────────────────────────────────────────┤
  │ Night     │ 22:00–5:00  │ Existing StarfieldContainer star layers   │
  ├───────────┼─────────────┼───────────────────────────────────────────┤
  │ Dawn      │ 5:00–7:00   │ Dark purple → warm orange → pink gradient │                                                                                                                                   
  ├───────────┼─────────────┼───────────────────────────────────────────┤                                                                                                                                   
  │ Morning   │ 7:00–10:00  │ Soft light blue, bright horizon           │                                                                                                                                   
  ├───────────┼─────────────┼───────────────────────────────────────────┤                                                                                                                                   
  │ Midday    │ 10:00–14:00 │ Bright blue, high contrast                │
  ├───────────┼─────────────┼───────────────────────────────────────────┤                                                                                                                                   
  │ Afternoon │ 14:00–18:00 │ Deeper blue, slight golden tint           │
  ├───────────┼─────────────┼───────────────────────────────────────────┤                                                                                                                                   
  │ Dusk      │ 18:00–22:00 │ Orange/red → purple gradient              │
  └───────────┴─────────────┴───────────────────────────────────────────┘                                                                                                                                   
   
  ---                                                                                                                                                                                                       
  Recommended Architecture
                          
  A new DynamicBackground component replaces StarfieldContainer on the home page:
                                                                                                                                                                                                            
  src/components/layout/
  ├── DynamicBackground.tsx     ← new wrapper (detects time, renders layers)                                                                                                                                
  ├── StarfieldContainer.tsx    ← keep as-is, used by DynamicBackground at night                                                                                                                            
  └── sky/                                                                                                                                                                                                  
      ├── NightSky.tsx          ← existing starfield logic extracted here                                                                                                                                   
      ├── DawnSky.tsx                                                                                                                                                                                       
      ├── MorningSky.tsx
      ├── MidaySky.tsx                                                                                                                                                                                      
      ├── AfternoonSky.tsx
      └── DuskSky.tsx                                                                                                                                                                                       
   
  DynamicBackground reads new Date().getHours(), selects the right sky component, and composes it with the scene image and content.                                                                         
                  
  ---                                                                                                                                                                                                       
  My Recommendation
                   
  Go with Path A. The transparent-sky PNG gives you a clean, viewport-size-agnostic solution that will scale correctly on any screen. The image editing is ~5 minutes in any tool (magic wand the sky,
  delete, export as PNG).