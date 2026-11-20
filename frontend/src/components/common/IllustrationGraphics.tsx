import React from 'react';

/**
 * 3D High-Tech AI Support Robot Illustration
 * Matching the top-left hero visual in the design reference image.
 */
export const AiRobotIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background glow flares */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Floating 3D Robot Container with gentle float animation */}
      <div className="relative animate-float">
        <svg
          viewBox="0 0 380 380"
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 drop-shadow-[0_20px_50px_rgba(99,102,241,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="robotBodyGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>

            <linearGradient id="robotVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06122c" />
              <stop offset="50%" stopColor="#0b1e4a" />
              <stop offset="100%" stopColor="#020817" />
            </linearGradient>

            <linearGradient id="robotGlowEyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="earPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            <filter id="neonVisorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Torso / Base Plate */}
          <ellipse cx="190" cy="275" rx="65" ry="45" fill="url(#robotBodyGrad)" />
          {/* Torso Core Ring */}
          <ellipse cx="190" cy="275" rx="36" ry="24" fill="#0b1329" stroke="#6366f1" strokeWidth="2.5" />
          {/* Core Logo Glyph */}
          <path
            d="M190 264 L181 270 V278 L190 284 L199 278 V270 Z"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            filter="url(#neonVisorGlow)"
          />

          {/* Floating Left Arm */}
          <path
            d="M115 240 C100 245 90 265 96 280 C102 295 125 295 130 280 C135 265 130 245 115 240 Z"
            fill="url(#robotBodyGrad)"
          />
          {/* Floating Right Hand gesturing forward */}
          <path
            d="M265 240 C280 245 290 265 284 280 C278 295 255 295 250 280 C245 265 250 245 265 240 Z"
            fill="url(#robotBodyGrad)"
          />

          {/* Neck Support Ring */}
          <ellipse cx="190" cy="210" rx="35" ry="12" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />

          {/* Left Ear Antenna Pod */}
          <ellipse cx="106" cy="155" rx="14" ry="26" fill="url(#earPlateGrad)" />
          <ellipse cx="106" cy="155" rx="8" ry="16" fill="#38bdf8" filter="url(#neonVisorGlow)" />

          {/* Right Ear Antenna Pod */}
          <ellipse cx="274" cy="155" rx="14" ry="26" fill="url(#earPlateGrad)" />
          <ellipse cx="274" cy="155" rx="8" ry="16" fill="#38bdf8" filter="url(#neonVisorGlow)" />

          {/* Head Sphere */}
          <ellipse cx="190" cy="155" rx="80" ry="72" fill="url(#robotBodyGrad)" />

          {/* Shiny top highlight on head */}
          <ellipse cx="185" cy="105" rx="42" ry="16" fill="#ffffff" opacity="0.65" />

          {/* Visor Screen Mask */}
          <rect
            x="130"
            y="125"
            width="120"
            height="62"
            rx="24"
            fill="url(#robotVisorGrad)"
            stroke="#6366f1"
            strokeWidth="2"
          />

          {/* Visor Light Reflection */}
          <path
            d="M136 135 C150 130 210 130 238 135 C242 136 244 140 240 142 C210 138 150 138 134 142 C132 140 133 136 136 135 Z"
            fill="#ffffff"
            opacity="0.3"
          />

          {/* Glowing Visor Eyes (Happy Cyan Ovals) */}
          <ellipse
            cx="165"
            cy="156"
            rx="13"
            ry="11"
            fill="url(#robotGlowEyeGrad)"
            filter="url(#neonVisorGlow)"
          />
          <ellipse
            cx="215"
            cy="156"
            rx="13"
            ry="11"
            fill="url(#robotGlowEyeGrad)"
            filter="url(#neonVisorGlow)"
          />

          {/* Eye Sparkle Highlights */}
          <circle cx="168" cy="153" r="3.5" fill="#ffffff" />
          <circle cx="218" cy="153" r="3.5" fill="#ffffff" />
        </svg>

        {/* Floating "Instant Answers" Glass Pill Card (From reference mockup) */}
        <div className="absolute -bottom-2 -left-4 sm:left-4 px-4 py-2 rounded-2xl glass-card-interactive border border-violet-400/30 shadow-glow-violet flex items-center gap-2.5 backdrop-blur-xl animate-float-slow">
          <div className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight">Instant Answers</div>
            <div className="text-[10px] text-violet-300 font-mono">pgvector verified • &lt;45ms</div>
          </div>
        </div>

        {/* Floating mini speech bubble on top right */}
        <div className="absolute -top-3 -right-2 sm:right-4 px-3 py-1.5 rounded-xl bg-violet-600/30 border border-violet-400/30 backdrop-blur-md shadow-glow flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-semibold text-slate-100">Grounded RAG</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 3D Isometric Server / Database Stack Illustration
 * Matching the Features page visual in the design reference image.
 */
export const ServerStackIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-60 h-60 rounded-full bg-violet-600/25 blur-3xl -z-10" />
      <svg
        viewBox="0 0 300 280"
        className="w-56 h-56 sm:w-72 sm:h-72 drop-shadow-[0_15px_40px_rgba(124,58,237,0.45)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>

        {/* Bottom Tier Layer */}
        <g transform="translate(0, 110)">
          {/* Left Face */}
          <path d="M70 70 L150 115 V140 L70 95 Z" fill="url(#cubeLeft)" stroke="#818cf8" strokeWidth="1" />
          {/* Right Face */}
          <path d="M150 115 L230 70 V95 L150 140 Z" fill="url(#cubeRight)" stroke="#818cf8" strokeWidth="1" />
          {/* Top Face */}
          <path d="M150 25 L230 70 L150 115 L70 70 Z" fill="url(#cubeTop)" stroke="#a5b4fc" strokeWidth="1.5" />
          {/* Glow lights */}
          <circle cx="100" cy="85" r="3" fill="#38bdf8" />
          <circle cx="115" cy="94" r="3" fill="#38bdf8" />
          <circle cx="130" cy="103" r="3" fill="#38bdf8" />
        </g>

        {/* Middle Tier Layer */}
        <g transform="translate(0, 55)">
          <path d="M70 70 L150 115 V140 L70 95 Z" fill="url(#cubeLeft)" stroke="#a78bfa" strokeWidth="1" />
          <path d="M150 115 L230 70 V95 L150 140 Z" fill="url(#cubeRight)" stroke="#a78bfa" strokeWidth="1" />
          <path d="M150 25 L230 70 L150 115 L70 70 Z" fill="url(#cubeTop)" stroke="#c4b5fd" strokeWidth="1.5" />
          <circle cx="100" cy="85" r="3" fill="#38bdf8" />
          <circle cx="115" cy="94" r="3" fill="#38bdf8" />
          <circle cx="130" cy="103" r="3" fill="#38bdf8" />
        </g>

        {/* Top Floating Tier Layer */}
        <g transform="translate(0, 0)">
          <path d="M70 70 L150 115 V140 L70 95 Z" fill="url(#cubeLeft)" stroke="#c084fc" strokeWidth="1" />
          <path d="M150 115 L230 70 V95 L150 140 Z" fill="url(#cubeRight)" stroke="#c084fc" strokeWidth="1" />
          <path d="M150 25 L230 70 L150 115 L70 70 Z" fill="url(#cubeTop)" stroke="#e9d5ff" strokeWidth="1.5" />
          {/* Top glowing core chip */}
          <path d="M150 50 L190 72 L150 95 L110 72 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="150" cy="72" r="8" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 3D Royal Crown Illustration
 * Matching the Pricing page visual in the design reference image.
 */
export const CrownIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-52 h-52 rounded-full bg-violet-600/30 blur-3xl -z-10" />
      <svg
        viewBox="0 0 240 200"
        className="w-48 h-48 sm:w-60 sm:h-60 drop-shadow-[0_15px_40px_rgba(139,92,246,0.5)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="gemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Crown Base Rim */}
        <ellipse cx="120" cy="165" rx="75" ry="16" fill="#312e81" stroke="#a78bfa" strokeWidth="2" />

        {/* Main Crown Body with 5 Peaks */}
        <path
          d="M45 165 C45 130 50 80 50 80 L78 120 L120 40 L162 120 L190 80 C190 80 195 130 195 165 Z"
          fill="url(#crownGrad)"
          stroke="#e0e7ff"
          strokeWidth="2"
        />

        {/* Front Trim Curve */}
        <path
          d="M45 165 C60 176 180 176 195 165 C180 156 60 156 45 165 Z"
          fill="#1e1b4b"
          stroke="#c084fc"
          strokeWidth="1.5"
        />

        {/* Sparkling Peak Gems */}
        <circle cx="50" cy="80" r="7" fill="url(#gemGrad)" />
        <circle cx="120" cy="40" r="10" fill="url(#gemGrad)" />
        <circle cx="190" cy="80" r="7" fill="url(#gemGrad)" />

        {/* Rim Embedded Jewels */}
        <circle cx="85" cy="165" r="4.5" fill="#38bdf8" />
        <circle cx="120" cy="166" r="6" fill="#ffffff" />
        <circle cx="155" cy="165" r="4.5" fill="#38bdf8" />
      </svg>
    </div>
  );
};

/**
 * 3D Isometric Question Mark Block
 * Matching FAQ section visual in reference image.
 */
export const QuestionMarkCubeIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-64 h-64 rounded-full bg-violet-600/30 blur-3xl -z-10" />
      <svg
        viewBox="0 0 240 240"
        className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-[0_20px_45px_rgba(99,102,241,0.45)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="qCubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="qCubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="qCubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>

        {/* Cube Left Face */}
        <path d="M40 90 L120 135 V205 L40 160 Z" fill="url(#qCubeLeft)" stroke="#6366f1" strokeWidth="1.5" />
        {/* Cube Right Face */}
        <path d="M120 135 L200 90 V160 L120 205 Z" fill="url(#qCubeRight)" stroke="#6366f1" strokeWidth="1.5" />
        {/* Cube Top Face */}
        <path d="M120 45 L200 90 L120 135 L40 90 Z" fill="url(#qCubeTop)" stroke="#a5b4fc" strokeWidth="2" />

        {/* Extruded Neon Question Mark Symbol */}
        <text
          x="120"
          y="155"
          textAnchor="middle"
          fontSize="90"
          fontWeight="900"
          fill="#ffffff"
          stroke="#38bdf8"
          strokeWidth="3"
          className="font-sans drop-shadow-[0_0_15px_rgba(56,189,248,0.9)]"
        >
          ?
        </text>
      </svg>
    </div>
  );
};

/**
 * 3D Neon Paper Plane Illustration
 * Matching Contact Us visual in reference image.
 */
export const PaperPlaneIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-56 h-56 rounded-full bg-indigo-600/30 blur-3xl -z-10" />
      <svg
        viewBox="0 0 240 240"
        className="w-52 h-52 sm:w-64 sm:h-64 drop-shadow-[0_20px_40px_rgba(99,102,241,0.5)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="planeGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="planeGradUnder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>

        {/* Exhaust trail lines */}
        <path d="M40 180 L80 150" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
        <path d="M55 205 L95 175" stroke="#818cf8" strokeWidth="3" strokeDasharray="8 6" opacity="0.8" />

        {/* Origami Paper Plane Polygon */}
        <polygon points="200,40 40,140 110,150 150,190" fill="url(#planeGradMain)" stroke="#c7d2fe" strokeWidth="2" />
        <polygon points="200,40 110,150 135,120" fill="url(#planeGradUnder)" stroke="#a5b4fc" strokeWidth="1.5" />
        <polygon points="110,150 150,190 135,140" fill="#3730a3" stroke="#818cf8" strokeWidth="1" />
      </svg>
    </div>
  );
};

/**
 * 3D Isometric Rocket Illustration
 * Matching the "Need a Custom Solution?" banner on Pricing page.
 */
export const RocketIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_10px_20px_rgba(139,92,246,0.6)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Exhaust flame */}
        <path d="M38 82 C28 94 30 110 30 110 C30 110 46 108 58 98 Z" fill="#f43f5e" />
        <path d="M41 85 C34 94 36 104 36 104 C36 104 46 102 55 95 Z" fill="#fbbf24" />

        {/* Left fin */}
        <path d="M38 68 L22 84 L40 85 Z" fill="#4f46e5" stroke="#818cf8" strokeWidth="1" />
        {/* Right fin */}
        <path d="M72 40 L88 56 L69 66 Z" fill="#4f46e5" stroke="#818cf8" strokeWidth="1" />

        {/* Main fuselage */}
        <ellipse cx="60" cy="60" rx="18" ry="32" transform="rotate(45 60 60)" fill="url(#rocketBody)" stroke="#e0e7ff" strokeWidth="1.5" />

        {/* Porthole */}
        <circle cx="65" cy="55" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="67" cy="53" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
};

/**
 * 404 Robot Illustration
 * Matching the 404 Page visual in the design reference image.
 */
export const NotFoundRobotIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-72 h-72 rounded-full bg-violet-600/30 blur-3xl -z-10" />
      <svg
        viewBox="0 0 320 320"
        className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-[0_20px_45px_rgba(99,102,241,0.5)] animate-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="robot404Body" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>

        {/* Base shadow */}
        <ellipse cx="160" cy="285" rx="70" ry="14" fill="#030712" opacity="0.6" />

        {/* Robot Body */}
        <ellipse cx="160" cy="220" rx="55" ry="45" fill="url(#robot404Body)" />

        {/* Robot Head */}
        <ellipse cx="160" cy="130" rx="65" ry="55" fill="url(#robot404Body)" />

        {/* Visor */}
        <rect x="110" y="105" width="100" height="50" rx="18" fill="#0b1329" stroke="#6366f1" strokeWidth="2" />

        {/* Puzzled Eyes */}
        <text x="135" y="140" fill="#38bdf8" fontSize="24" fontWeight="bold">?</text>
        <text x="185" y="140" fill="#38bdf8" fontSize="24" fontWeight="bold">?</text>

        {/* Question Mark Block Held by Robot */}
        <g transform="translate(130, 200)">
          <rect x="0" y="0" width="60" height="60" rx="12" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
          <text x="30" y="44" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="bold">?</text>
        </g>
      </svg>
    </div>
  );
};

/**
 * About Us Holographic Enterprise Boardroom Visual
 * Matching About Us visual in the design reference image.
 */
export const BoardroomHologramVisual: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative rounded-3xl overflow-hidden glass-panel border border-violet-500/20 shadow-glow-violet p-6 select-none ${className}`}>
      {/* Background illumination */}
      <div className="absolute inset-0 bg-gradient-to-tr from-navy-950 via-navy-850 to-indigo-950/40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Futuristic Boardroom Graphic */}
      <div className="relative z-10 flex flex-col items-center justify-center py-8">
        {/* Hologram Floating Emblem */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 p-0.5 shadow-glow-violet animate-float">
          <div className="w-full h-full rounded-2xl bg-navy-900/90 flex items-center justify-center backdrop-blur-md">
            <span className="text-4xl font-extrabold text-white gradient-text-violet">S</span>
          </div>
        </div>

        {/* Hologram Light Rays */}
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4 opacity-75 shadow-glow" />
        <div className="text-center mt-3">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">
            Enterprise Intelligence Grid
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Multi-Tenant Isolation • pgvector Grounding</p>
        </div>

        {/* Executive Silhouette representation */}
        <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 opacity-80">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-violet-500/30 flex items-center justify-center text-[10px] text-slate-400">
                AI
              </div>
              <div className="w-12 h-6 rounded-t-xl bg-slate-800/60 border-t border-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
