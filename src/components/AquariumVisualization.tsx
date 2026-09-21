import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Droplet,
  Flame,
  Wind,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  Calendar,
  Utensils,
} from 'lucide-react';
import { PortionSize } from '../types/aquavista';

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
}

interface Fish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number; // 1 = right, -1 = left
  size: number;
  speed: number;
  swimFreq: number;
  tailPhase: number;
  depthRatio: number; // 0.1 to 0.85
  type: 'clownfish' | 'neontetra' | 'bluetang' | 'goldenguppy' | 'rubybarb';
}

interface FoodPellet {
  id: number;
  x: number;
  y: number;
  vy: number;
  r: number;
}

export const AquariumVisualization: React.FC = () => {
  const {
    telemetry,
    devices,
    cleaningState,
    feeder,
    triggerFeed,
    updateFeederSettings,
    feedEventTrigger,
    setActiveTab,
  } = useAquavista();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const fishesRef = useRef<Fish[]>([]);
  const foodRef = useRef<FoodPellet[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const prevTriggerRef = useRef(feedEventTrigger);
  const [showPortionSelect, setShowPortionSelect] = useState(false);

  // Initialize fishes once
  useEffect(() => {
    if (fishesRef.current.length === 0) {
      fishesRef.current = [
        {
          id: 1,
          x: 120,
          y: 120,
          vx: 1.1,
          vy: 0,
          dir: 1,
          size: 26,
          speed: 1.2,
          swimFreq: 0.16,
          tailPhase: 0,
          depthRatio: 0.45,
          type: 'clownfish', // Nemo
        },
        {
          id: 2,
          x: 280,
          y: 90,
          vx: -1.4,
          vy: 0,
          dir: -1,
          size: 20,
          speed: 1.5,
          swimFreq: 0.22,
          tailPhase: 1.2,
          depthRatio: 0.3,
          type: 'neontetra', // Glowing tetra
        },
        {
          id: 3,
          x: 420,
          y: 140,
          vx: 0.9,
          vy: 0,
          dir: 1,
          size: 28,
          speed: 1.0,
          swimFreq: 0.14,
          tailPhase: 2.5,
          depthRatio: 0.6,
          type: 'bluetang', // Dory
        },
        {
          id: 4,
          x: 200,
          y: 165,
          vx: -0.85,
          vy: 0,
          dir: -1,
          size: 24,
          speed: 0.9,
          swimFreq: 0.15,
          tailPhase: 3.8,
          depthRatio: 0.72,
          type: 'goldenguppy', // Flowing golden tail
        },
        {
          id: 5,
          x: 520,
          y: 105,
          vx: 1.3,
          vy: 0,
          dir: 1,
          size: 22,
          speed: 1.3,
          swimFreq: 0.2,
          tailPhase: 4.1,
          depthRatio: 0.38,
          type: 'rubybarb', // Vibrant red barb
        },
        {
          id: 6,
          x: 340,
          y: 130,
          vx: -1.2,
          vy: 0,
          dir: -1,
          size: 19,
          speed: 1.4,
          swimFreq: 0.24,
          tailPhase: 5.3,
          depthRatio: 0.5,
          type: 'neontetra', // Companion tetra
        },
      ];
    }
  }, []);

  // Listen to external/auto feeding trigger events and drop flakes from dispenser
  useEffect(() => {
    if (feedEventTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = feedEventTrigger;
      const canvas = canvasRef.current;
      const w = canvas?.width || 700;
      const feederX = w * 0.72 + 21;
      const count = feeder.portionSize === 'small' ? 4 : feeder.portionSize === 'large' ? 10 : 6;

      for (let i = 0; i < count; i++) {
        foodRef.current.push({
          id: Math.random(),
          x: feederX + (Math.random() * 32 - 16),
          y: 22 + Math.random() * 10,
          vy: 0.55 + Math.random() * 0.6,
          r: 2 + Math.random() * 1.5,
        });
      }
    }
  }, [feedEventTrigger, feeder.portionSize]);

  // Drop fish food flakes from manual canvas click
  const dropFoodManual = useCallback((clickX?: number, clickY?: number) => {
    const canvas = canvasRef.current;
    const w = canvas?.width || 600;
    const baseCenterX = clickX !== undefined ? clickX : w * (0.3 + Math.random() * 0.4);
    const startY = clickY !== undefined ? Math.min(clickY, 65) : 35;

    for (let i = 0; i < 4; i++) {
      foodRef.current.push({
        id: Math.random(),
        x: baseCenterX + (Math.random() * 30 - 15),
        y: startY + Math.random() * 10,
        vy: 0.5 + Math.random() * 0.6,
        r: 2 + Math.random() * 1.5,
      });
    }

    triggerFeed(feeder.portionSize, 'manual');
  }, [triggerFeed, feeder.portionSize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    dropFoodManual(x, y);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 240);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 240;
      }
    };
    window.addEventListener('resize', handleResize);

    // Initialize rising bubbles for oxygen pump
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 22; i++) {
        bubblesRef.current.push({
          x: width * 0.48 + (Math.random() * 44 - 22),
          y: Math.random() * height,
          r: 1.2 + Math.random() * 2.2,
          speed: 1.2 + Math.random() * 1.6,
        });
      }
    }

    // Helper: Draw Fish
    const drawFish = (f: Fish) => {
      const s = f.size;
      const tailWiggle = Math.sin(f.tailPhase) * 0.38;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.dir, 1);

      if (f.type === 'clownfish') {
        // --- CLOWNFISH (Orange & White Nemo) ---
        ctx.save();
        ctx.translate(-s * 0.65, 0);
        ctx.rotate(tailWiggle);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s * 0.35, -s * 0.3, -s * 0.5, -s * 0.38);
        ctx.quadraticCurveTo(-s * 0.38, 0, -s * 0.5, s * 0.38);
        ctx.quadraticCurveTo(-s * 0.35, s * 0.3, 0, 0);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Dorsal fin
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, -s * 0.35);
        ctx.quadraticCurveTo(0, -s * 0.65, s * 0.2, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Main Body
        const bodyGrad = ctx.createLinearGradient(-s * 0.7, 0, s * 0.7, 0);
        bodyGrad.addColorStop(0, '#f97316');
        bodyGrad.addColorStop(0.5, '#ea580c');
        bodyGrad.addColorStop(1, '#ff7a00');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.7, s * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // White stripes
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.ellipse(s * 0.22, 0, s * 0.09, s * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(-s * 0.12, 0, s * 0.085, s * 0.41, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pectoral Fin
        ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
        ctx.beginPath();
        ctx.ellipse(s * 0.05, s * 0.18, s * 0.18, s * 0.1, 0.4 + tailWiggle * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.1, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(s * 0.47, -s * 0.1, s * 0.055, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.12, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'neontetra') {
        // --- NEON TETRA ---
        ctx.save();
        ctx.translate(-s * 0.65, 0);
        ctx.rotate(tailWiggle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-s * 0.45, -s * 0.28);
        ctx.lineTo(-s * 0.3, 0);
        ctx.lineTo(-s * 0.45, s * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.72, s * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, 0);
        ctx.quadraticCurveTo(-s * 0.3, s * 0.25, -s * 0.65, 0);
        ctx.lineTo(-s * 0.1, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, -s * 0.04);
        ctx.lineTo(s * 0.48, -s * 0.04);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.06, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(s * 0.47, -s * 0.06, s * 0.045, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'bluetang') {
        // --- BLUE TANG ---
        ctx.save();
        ctx.translate(-s * 0.68, 0);
        ctx.rotate(tailWiggle);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-s * 0.42, -s * 0.36);
        ctx.quadraticCurveTo(-s * 0.25, 0, -s * 0.42, s * 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const tangGrad = ctx.createLinearGradient(0, -s * 0.45, 0, s * 0.45);
        tangGrad.addColorStop(0, '#2563eb');
        tangGrad.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = tangGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.68, s * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-s * 0.1, 0, s * 0.32, -1.2, 1.2);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(s * 0.08, s * 0.12, s * 0.16, s * 0.09, 0.5 + tailWiggle * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.44, -s * 0.12, s * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(s * 0.46, -s * 0.12, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'goldenguppy') {
        // --- GOLDEN GUPPY ---
        ctx.save();
        ctx.translate(-s * 0.6, 0);
        ctx.rotate(tailWiggle * 1.3);
        const tailGrad = ctx.createLinearGradient(-s * 0.8, 0, 0, 0);
        tailGrad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
        tailGrad.addColorStop(1, 'rgba(245, 158, 11, 0.4)');
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, -s * 0.75, -s * 0.45);
        ctx.quadraticCurveTo(-s * 0.6, 0, -s * 0.75, s * 0.45);
        ctx.quadraticCurveTo(-s * 0.4, s * 0.5, 0, 0);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.62, s * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(s * 0.1, s * 0.08, s * 0.35, s * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(s * 0.42, -s * 0.08, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- RUBY BARB ---
        ctx.save();
        ctx.translate(-s * 0.62, 0);
        ctx.rotate(tailWiggle);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-s * 0.4, -s * 0.3);
        ctx.lineTo(-s * 0.28, 0);
        ctx.lineTo(-s * 0.4, s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const barbGrad = ctx.createLinearGradient(0, -s * 0.35, 0, s * 0.35);
        barbGrad.addColorStop(0, '#fb7185');
        barbGrad.addColorStop(1, '#e11d48');
        ctx.fillStyle = barbGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.65, s * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.3);
        ctx.lineTo(0, s * 0.3);
        ctx.moveTo(-s * 0.25, -s * 0.22);
        ctx.lineTo(-s * 0.25, s * 0.22);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.42, -s * 0.08, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9f1239';
        ctx.beginPath();
        ctx.arc(s * 0.44, -s * 0.08, s * 0.055, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const render = () => {
      timeRef.current += 0.03;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Deep Tank Background
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 0, width, height);

      // Calculate water surface position
      const safeLevel = Math.max(10, Math.min(100, telemetry.waterLevel));
      const waterTopY = height - height * 0.78 * (safeLevel / 100) - 15;

      // Subtle light illumination when light is ON
      if (devices.light.on) {
        const lightGrad = ctx.createLinearGradient(width / 2, 0, width / 2, height);
        lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
        lightGrad.addColorStop(0.6, 'rgba(0, 245, 212, 0.08)');
        lightGrad.addColorStop(1, 'rgba(0, 245, 212, 0.01)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(10, 5, width - 20, height - 10);
      }

      // Water Body with surface wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(10, height - 10);
      ctx.lineTo(10, waterTopY);

      const waveAmp = devices.fillPump.on || devices.drainPump.on ? 3.5 : 1.8;
      for (let x = 10; x <= width - 10; x += 10) {
        const y = waterTopY + Math.sin(x * 0.02 + t * 2) * waveAmp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width - 10, height - 10);
      ctx.closePath();

      // Deep aquatic water gradient
      const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, height);
      waterGrad.addColorStop(0, 'rgba(0, 180, 216, 0.35)');
      waterGrad.addColorStop(0.7, 'rgba(3, 30, 65, 0.72)');
      waterGrad.addColorStop(1, 'rgba(2, 18, 40, 0.88)');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Water surface highlight line
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Clip underwater elements so they strictly stay submerged
      ctx.clip();

      // --- 1. Swaying Aquatic Seaweed / Kelp at bottom ---
      const drawKelp = (baseX: number, frondHeight: number, waveOffset: number) => {
        const sway = Math.sin(t * 1.4 + waveOffset) * 12;
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(baseX, height - 12);
        ctx.quadraticCurveTo(baseX + sway * 0.5, height - 12 - frondHeight * 0.5, baseX + sway, height - 12 - frondHeight);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.ellipse(baseX + sway * 0.7, height - 12 - frondHeight * 0.65, 5, 2.5, sway * 0.05, 0, Math.PI * 2);
        ctx.fill();
      };

      drawKelp(24, 65, 0);
      drawKelp(38, 85, 1.2);
      drawKelp(52, 50, 2.4);
      drawKelp(width - 32, 70, 0.8);
      drawKelp(width - 48, 90, 2.0);
      drawKelp(width - 64, 55, 3.2);

      // --- 2. Smooth River Pebbles / Gravel Bed ---
      for (let px = 18; px < width - 15; px += 26) {
        ctx.fillStyle = px % 52 === 0 ? '#1e293b' : '#334155';
        ctx.beginPath();
        ctx.ellipse(px + 6, height - 13, 11, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 3. Rising Oxygen Bubbles ---
      if (devices.airPump.on) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        bubblesRef.current.forEach((b) => {
          b.y -= b.speed;
          if (b.y <= waterTopY) {
            b.y = height - 18;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // --- 4. Food Pellets Update & Draw ---
      for (let i = foodRef.current.length - 1; i >= 0; i--) {
        const p = foodRef.current[i];
        p.y += p.vy;
        p.x += Math.sin(t * 3 + p.id) * 0.3;

        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.y >= height - 16) {
          foodRef.current.splice(i, 1);
        }
      }

      // --- 5. Animated Tropical Fishes ---
      const minSwimY = waterTopY + 22;
      const maxSwimY = height - 28;
      const effectiveDepth = Math.max(25, maxSwimY - minSwimY);

      fishesRef.current.forEach((fish) => {
        const targetY = minSwimY + effectiveDepth * fish.depthRatio;

        let nearestFood: FoodPellet | null = null;
        let nearestDist = 180;
        foodRef.current.forEach((pellet) => {
          const d = Math.hypot(pellet.x - fish.x, pellet.y - fish.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestFood = pellet;
          }
        });

        if (nearestFood) {
          const nf = nearestFood as FoodPellet;
          const angle = Math.atan2(nf.y - fish.y, nf.x - fish.x);
          fish.vx += Math.cos(angle) * 0.08;
          fish.vy += Math.sin(angle) * 0.06;
          fish.dir = fish.vx >= 0 ? 1 : -1;

          if (nearestDist < 9) {
            foodRef.current = foodRef.current.filter((p) => p.id !== nf.id);
            bubblesRef.current.push({
              x: fish.x,
              y: fish.y - 4,
              r: 1.5,
              speed: 1.8,
            });
          }
        } else {
          fish.vy += (targetY - fish.y) * 0.02;
          fish.vy *= 0.94;

          if (fish.x > width - 40 && fish.vx > 0) {
            fish.vx = -Math.abs(fish.speed);
            fish.dir = -1;
          } else if (fish.x < 40 && fish.vx < 0) {
            fish.vx = Math.abs(fish.speed);
            fish.dir = 1;
          }
        }

        const maxV = fish.speed * 1.4;
        fish.vx = Math.max(-maxV, Math.min(maxV, fish.vx));
        fish.vy = Math.max(-1.5, Math.min(1.5, fish.vy));

        fish.x += fish.vx;
        fish.y += fish.vy;

        if (fish.y < minSwimY) {
          fish.y = minSwimY;
          fish.vy = 0.5;
        }
        if (fish.y > maxSwimY) {
          fish.y = maxSwimY;
          fish.vy = -0.5;
        }

        fish.tailPhase += fish.swimFreq * (Math.abs(fish.vx) * 1.5 + 0.6);
        drawFish(fish);
      });

      // --- 6. Heater convective glow when active ---
      if (devices.heater.on && !devices.heater.isInterlocked) {
        const hx = width * 0.12;
        const heatGlow = ctx.createRadialGradient(hx, height - 60, 4, hx, height - 60, 45);
        heatGlow.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
        heatGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = heatGlow;
        ctx.beginPath();
        ctx.arc(hx, height - 60, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(hx - 3, waterTopY + 10, 6, height - waterTopY - 25);
      }

      // --- 7. Water flow stream when fill pump is active ---
      if (devices.fillPump.on) {
        ctx.fillStyle = 'rgba(0, 245, 212, 0.75)';
        ctx.fillRect(width * 0.08, 10, 4, Math.max(0, waterTopY - 10));
      }

      // --- 8. Drain indication when drain pump is active ---
      if (devices.drainPump.on) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width * 0.9, height - 15, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // --- 9. Smart Auto Feeder Hardware Unit Mounted at Top Rim ---
      const fx = width * 0.72;
      ctx.save();
      // Feeder Box Body
      ctx.fillStyle = '#0a192f';
      ctx.strokeStyle = feeder.isDispensing ? '#f59e0b' : feeder.autoMode ? '#00f5d4' : '#475569';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(fx, 6, 44, 15, 3);
      ctx.fill();
      ctx.stroke();

      // Status LED indicator
      ctx.fillStyle = feeder.isDispensing ? '#f59e0b' : feeder.autoMode ? '#10b981' : '#64748b';
      if (feeder.isDispensing || feeder.autoMode) {
        ctx.shadowColor = feeder.isDispensing ? '#f59e0b' : '#10b981';
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.arc(fx + 7, 13.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Feeder chute nozzle pointing into water
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(fx + 18, 21);
      ctx.lineTo(fx + 28, 21);
      ctx.lineTo(fx + 25, 26);
      ctx.lineTo(fx + 21, 26);
      ctx.closePath();
      ctx.fill();

      // Text label on dispenser
      ctx.fillStyle = feeder.autoMode ? '#e2e8f0' : '#94a3b8';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('AUTO FEED', fx + 12, 16);
      ctx.restore();

      // Aquarium Outer Glass Frame
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, width - 16, height - 16);

      // Safe minimum waterline (30%)
      const y30 = height - height * 0.78 * (30 / 100) - 15;
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(15, y30);
      ctx.lineTo(width - 15, y30);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('Min Safe (30%)', width - 85, y30 - 4);
      ctx.restore();

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [telemetry.waterLevel, devices, feeder.autoMode, feeder.isDispensing]);

  const isChangingWater = cleaningState.status === 'draining' || cleaningState.status === 'refilling';

  // Format countdown string (hours & minutes for realistic daily schedules)
  const formatCountdown = (secs: number) => {
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-ocean-700/60 p-4 space-y-3">
      {/* Top Header of the visualization */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Droplet className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Aquarium Water Level & Live Bio-Tank</h3>
          {isChangingWater && (
            <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              {cleaningState.phase}
            </span>
          )}
          <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            6 Tropical Fish
          </span>
        </div>

        {/* Right side controls: Auto mode, Portion, Feed button, Water Level */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Automatic Mode Toggle */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ocean-900/80 border border-ocean-800 text-xs font-mono">
            <span className="text-slate-400">Auto Mode:</span>
            <button
              onClick={() => updateFeederSettings({ autoMode: !feeder.autoMode })}
              className={`flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                feeder.autoMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle Automatic Feeding Mode"
            >
              {feeder.autoMode ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px]">ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-500" />
                  <span className="text-[11px]">OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Next Auto Feed Countdown Badge */}
          {feeder.autoMode && (
            <button
              onClick={() => setActiveTab('schedules')}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 transition-colors cursor-pointer"
              title="View & Edit Feeding Schedules"
            >
              <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Next: {formatCountdown(feeder.nextFeedInSeconds)}</span>
            </button>
          )}

          {/* Portion Size Quick Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPortionSelect(!showPortionSelect)}
              className="px-2 py-1 text-[11px] font-mono rounded-lg bg-ocean-900 hover:bg-ocean-800 border border-ocean-700 text-slate-300 hover:text-white transition-colors cursor-pointer capitalize flex items-center gap-1"
              title="Select portion size"
            >
              <span>Portion:</span>
              <span className="text-amber-400 font-bold">{feeder.portionSize}</span>
            </button>

            {showPortionSelect && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-ocean-900 border border-ocean-700 rounded-lg shadow-xl p-1 text-xs space-y-0.5 min-w-[110px]">
                {(['small', 'medium', 'large'] as PortionSize[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      updateFeederSettings({ portionSize: p });
                      setShowPortionSelect(false);
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                      feeder.portionSize === p
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-ocean-800'
                    }`}
                  >
                    {p} {p === 'small' ? '(2 flakes)' : p === 'medium' ? '(5 flakes)' : '(8 flakes)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Feed Button */}
          <button
            onClick={() => triggerFeed(feeder.portionSize, 'manual')}
            disabled={feeder.isDispensing}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              feeder.isDispensing
                ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-200 border border-cyan-500/40 hover:scale-105 active:scale-95 shadow-sm shadow-cyan-500/10'
            }`}
            title="Dispense nutrient flakes now"
          >
            <Sparkles className={`w-3.5 h-3.5 ${feeder.isDispensing ? 'text-amber-300 animate-spin' : 'text-amber-300'}`} />
            <span>{feeder.isDispensing ? 'Dispensing...' : 'Feed Now'}</span>
          </button>

          {/* Schedules Quick Link */}
          <button
            onClick={() => setActiveTab('schedules')}
            className="p-1.5 rounded-lg bg-ocean-900 hover:bg-ocean-800 text-slate-400 hover:text-cyan-300 border border-ocean-800 transition-colors cursor-pointer"
            title="Configure Feeding Schedules"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {/* Water Level */}
          <div className="flex items-center gap-1 text-xs font-mono pl-1 border-l border-ocean-800">
            <span className="text-slate-400">Level:</span>
            <span className="text-white font-bold">{telemetry.waterLevel.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Aquarium Canvas */}
      <div
        className="relative w-full h-[240px] rounded-xl overflow-hidden bg-[#060d17] group cursor-crosshair select-none"
        onClick={handleCanvasClick}
        title="Click anywhere on the water to drop food flakes for fishes!"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Click hint tooltip on hover */}
        <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-cyan-300/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20 pointer-events-none flex items-center gap-1">
          <Utensils className="w-3 h-3 text-amber-400" /> Click water to drop food flakes 🫧
        </div>

        {/* Live Status Indicators overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none flex-wrap">
          {devices.heater.on && !devices.heater.isInterlocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flame className="w-3 h-3 text-rose-400" /> Heater ON
            </span>
          )}
          {devices.airPump.on && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Wind className="w-3 h-3 text-cyan-400" /> Oxygen Pump ON
            </span>
          )}
          {devices.fillPump.on && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              <ArrowUpCircle className="w-3 h-3 text-emerald-400" /> Filling Water...
            </span>
          )}
          {devices.drainPump.on && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <ArrowDownCircle className="w-3 h-3 text-amber-400" /> Draining Water...
            </span>
          )}
          {feeder.isDispensing && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-bounce">
              <Utensils className="w-3 h-3 text-amber-400" /> Smart Feeder Dispensing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
