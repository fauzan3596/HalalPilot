import React from "react";
import { interpolate } from "remotion";

/**
 * Avatar kartun Fauzan (SVG): rambut hitam pendek, hoodie hijau HalalPilot.
 * `mouth` 0..1 = bukaan mulut dari amplitudo suara, `blink` 0..1, `wave` 0..1 = tangan melambai, `t` detik untuk gerak halus.
 */
export const Avatar: React.FC<{ mouth: number; blink: number; wave: number; t: number; talk: number }> = ({ mouth, blink, wave, t, talk }) => {
  const skin = "#c98f66", skinShade = "#b07a53", hair = "#1b1714";
  const sway = Math.sin(t * 1.3) * 1.6 + talk * Math.sin(t * 5.1) * 1.2;   // derajat
  const nod = talk * Math.sin(t * 7.3) * 4;                                 // px
  const brow = -mouth * 6;                                                   // alis naik saat bicara keras
  const mOpen = 4 + mouth * 36, mW = 58 - mouth * 10;
  const eyeH = 1 - blink;
  const armRot = interpolate(wave, [0, 1], [0, 1]) * (-28 + Math.sin(t * 11) * 16);
  const armLift = wave;
  return (
    <svg viewBox="0 0 900 1000" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="faceShade" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor={skin} /><stop offset="100%" stopColor={skinShade} /></radialGradient>
        <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3f8a5f" /><stop offset="100%" stopColor="#24563b" /></linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity="0.45" /></filter>
      </defs>
      {/* bayangan lantai */}
      <ellipse cx="450" cy="985" rx="300" ry="26" fill="#000" opacity="0.35" />
      <g filter="url(#soft)" transform={`rotate(${sway * 0.4} 450 990)`}>
        {/* lengan kanan (sisi kiri layar) yang melambai */}
        {/* digambar sebelum badan: saat turun, lengan tersembunyi di balik hoodie; berporos di bahu (250, 820) */}
        <g transform={`rotate(${interpolate(armLift, [0, 1], [175, -18]) + armRot * 0.6} 250 820)`}>
          <rect x="212" y="560" width="78" height="275" rx="38" fill="url(#hoodie)" />
          <circle cx="251" cy="548" r="46" fill={skin} />
          <rect x="218" y="500" width="20" height="54" rx="10" fill={skin} />
          <rect x="240" y="490" width="20" height="60" rx="10" fill={skin} />
          <rect x="262" y="494" width="20" height="58" rx="10" fill={skin} />
          <rect x="282" y="508" width="18" height="46" rx="9" fill={skin} />
        </g>
        {/* badan / hoodie */}
        <path d="M150 1000 C150 800 250 720 450 720 C650 720 750 800 750 1000 Z" fill="url(#hoodie)" />
        <path d="M360 724 L450 820 L540 724 Z" fill="#1d4a32" />
        <path d="M372 724 C390 770 510 770 528 724" fill="none" stroke="#2c6a48" strokeWidth="10" strokeLinecap="round" />
        <line x1="420" y1="800" x2="410" y2="880" stroke="#cfe3d6" strokeWidth="6" strokeLinecap="round" />
        <line x1="480" y1="800" x2="490" y2="880" stroke="#cfe3d6" strokeWidth="6" strokeLinecap="round" />
        {/* lencana HalalPilot di dada */}
        <g transform="translate(585 815)"><circle r="40" fill="#0f2418" stroke="#e0a84a" strokeWidth="4" /><text x="0" y="12" textAnchor="middle" fontFamily="SegoeDemo" fontWeight="700" fontSize="34" fill="#f3f6f3">HP</text></g>
        {/* leher */}
        <path d="M400 640 L400 735 C430 760 470 760 500 735 L500 640 Z" fill={skinShade} />
        {/* kepala */}
        <g transform={`translate(0 ${nod}) rotate(${sway} 450 640)`}>
          <ellipse cx="282" cy="455" rx="34" ry="48" fill={skinShade} />
          <ellipse cx="618" cy="455" rx="34" ry="48" fill={skinShade} />
          <path d="M290 400 C290 250 360 205 450 205 C540 205 610 250 610 400 L610 500 C610 610 540 680 450 680 C360 680 290 610 290 500 Z" fill="url(#faceShade)" />
          {/* rambut */}
          <path d="M276 420 C262 260 340 160 455 160 C575 160 640 250 624 420 C612 360 598 318 578 300 C540 318 470 312 420 292 C385 318 330 330 300 318 C290 345 282 380 276 420 Z" fill={hair} />
          <path d="M300 318 C340 300 390 270 420 292 C380 300 345 316 300 318 Z" fill="#2a2420" />
          {/* alis */}
          <g transform={`translate(0 ${brow})`}>
            <path d="M335 388 C360 372 395 370 418 380" fill="none" stroke={hair} strokeWidth="13" strokeLinecap="round" />
            <path d="M482 380 C505 370 540 372 565 388" fill="none" stroke={hair} strokeWidth="13" strokeLinecap="round" />
          </g>
          {/* mata */}
          <g>
            <ellipse cx="378" cy="438" rx="28" ry={22 * eyeH + 1} fill="#fff" />
            <ellipse cx="522" cy="438" rx="28" ry={22 * eyeH + 1} fill="#fff" />
            <ellipse cx="382" cy="440" rx="14" ry={14 * eyeH + 0.5} fill="#2b1d14" />
            <ellipse cx="526" cy="440" rx="14" ry={14 * eyeH + 0.5} fill="#2b1d14" />
            <circle cx="387" cy="434" r={4 * eyeH} fill="#fff" />
            <circle cx="531" cy="434" r={4 * eyeH} fill="#fff" />
          </g>
          {/* hidung */}
          <path d="M452 460 C446 500 440 515 452 522 C460 526 468 524 472 518" fill="none" stroke={skinShade} strokeWidth="7" strokeLinecap="round" />
          {/* pipi */}
          <ellipse cx="345" cy="530" rx="30" ry="16" fill="#e0866e" opacity="0.28" />
          <ellipse cx="555" cy="530" rx="30" ry="16" fill="#e0866e" opacity="0.28" />
          {/* mulut: bukaan mengikuti amplitudo suara */}
          <g transform="translate(450 580)">
            <path d={`M${-mW / 2} 0 Q0 ${-6 + mOpen * 0.1} ${mW / 2} 0 Q0 ${mOpen} ${-mW / 2} 0 Z`} fill="#5a1f1a" />
            <path d={`M${-mW / 2 + 8} 1 Q0 ${-3} ${mW / 2 - 8} 1 L${mW / 2 - 12} ${Math.min(8, mOpen * 0.25)} Q0 ${Math.min(10, mOpen * 0.28)} ${-mW / 2 + 12} ${Math.min(8, mOpen * 0.25)} Z`} fill="#fff" opacity={mouth > 0.15 ? 0.9 : 0} />
            <ellipse cx="0" cy={mOpen * 0.68} rx={mW * 0.22} ry={mOpen * 0.18} fill="#c2524a" opacity={mouth > 0.25 ? 0.9 : 0} />
            <path d={`M${-mW / 2 - 4} -2 Q0 ${8 + (1 - mouth) * 10} ${mW / 2 + 4} -2`} fill="none" stroke="#7a3a2c" strokeWidth="5" strokeLinecap="round" opacity={1 - Math.min(1, mouth * 3)} />
          </g>
        </g>
      </g>
    </svg>
  );
};
