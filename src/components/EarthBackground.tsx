import React, { useEffect, useRef } from 'react';

interface EarthBackgroundProps {
  showLogo?: boolean;
}

export function EarthBackground({ showLogo = true }: EarthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const radius = Math.min(width, height) * 0.25;

      // 深空背景
      const spaceGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
      spaceGradient.addColorStop(0, '#0a0a15');
      spaceGradient.addColorStop(0.5, '#050510');
      spaceGradient.addColorStop(1, '#020205');
      ctx.fillStyle = spaceGradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星空
      for (let i = 0; i < 300; i++) {
        const x = (Math.sin(i * 12.34) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 45.67) * 0.5 + 0.5) * height;
        const starRadius = Math.random() * 0.8 + 0.2;
        const alpha = Math.random() * 0.5 + 0.2;

        ctx.beginPath();
        ctx.arc(x, y, starRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      // 地球大气层光晕 - 单层柔和渐变
      const glowRadius = radius + 25;
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.9,
        centerX, centerY, glowRadius
      );
      glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      glowGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.1)');
      glowGradient.addColorStop(0.7, 'rgba(34, 211, 238, 0.05)');
      glowGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // 地球轮廓
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      const earthGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX, centerY, radius
      );
      earthGradient.addColorStop(0, '#1a3a5c');
      earthGradient.addColorStop(0.5, '#0d2538');
      earthGradient.addColorStop(1, '#051220');
      ctx.fillStyle = earthGradient;
      ctx.fill();

      // 地球边缘轮廓光 - 单层
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Logo 绘制
  useEffect(() => {
    if (!showLogo) return;

    const canvas = logoCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = 200;
    const height = 80;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scale = width / 200;
    const centerX = 40 * scale;
    const centerY = 40 * scale;
    const planetRadius = 18 * scale;
    const rx = 36 * scale;
    const ry = 10 * scale;
    const rotation = -20 * (Math.PI / 180);

    let angle = 0;

    const drawPlanet = () => {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, planetRadius);
      gradient.addColorStop(0, '#1A1A3E');
      gradient.addColorStop(0.6, '#0F0F2A');
      gradient.addColorStop(1, '#0A0A1A');

      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.5;

      ctx.beginPath();
      ctx.ellipse(0, 0, planetRadius, planetRadius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, planetRadius * 0.4, planetRadius, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-planetRadius, 0);
      ctx.lineTo(planetRadius, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -planetRadius);
      ctx.lineTo(0, planetRadius);
      ctx.stroke();

      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(-5 * scale, -4 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(8 * scale, 2 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-2 * scale, 6 * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawRing = (isBack: boolean) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      const gradient = ctx.createLinearGradient(-rx, -ry, rx, ry);
      gradient.addColorStop(0, '#00D4FF');
      gradient.addColorStop(0.5, '#8B5CF6');
      gradient.addColorStop(1, '#00D4FF');

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = isBack ? 0.6 : 0.9;

      if (isBack) {
        ctx.clip(new Path2D('M -100 -100 L 100 -100 L 100 0 L -100 0 Z'), 'nonzero');
      } else {
        ctx.clip(new Path2D('M -100 0 L 100 0 L 100 100 L -100 100 Z'), 'nonzero');
      }

      ctx.stroke();

      if (!isBack) {
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 2.5 * scale, ry + 1.8 * scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawLobster = (x: number, y: number) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.translate(x, y);
      ctx.rotate(-rotation + 60 * (Math.PI / 180));
      ctx.scale(0.085 * scale, 0.085 * scale);

      const gradient = ctx.createLinearGradient(-20, -40, 20, 50);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(1, '#EE5A5A');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 15, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, -8, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-4, -14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -14, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, -14, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -14, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-3, -18);
      ctx.quadraticCurveTo(-12, -35, -18, -42);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(3, -18);
      ctx.quadraticCurveTo(12, -35, 18, -42);
      ctx.stroke();

      ctx.save();
      ctx.translate(-16, -5);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF8E8E';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-6, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(16, -5);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF8E8E';
      ctx.beginPath();
      ctx.moveTo(4, -6);
      ctx.lineTo(10, -12);
      ctx.lineTo(6, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.quadraticCurveTo(-22, 12, -26, 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, 18);
      ctx.quadraticCurveTo(-20, 22, -24, 32);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, 28);
      ctx.quadraticCurveTo(-18, 32, -22, 42);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.quadraticCurveTo(22, 12, 26, 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.quadraticCurveTo(20, 22, 24, 32);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 28);
      ctx.quadraticCurveTo(18, 32, 22, 42);
      ctx.stroke();

      ctx.save();
      ctx.translate(0, 35);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 8, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 15, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const drawText = () => {
      const textX = 85 * scale;

      ctx.save();
      ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
      ctx.shadowBlur = 4;

      const textGradient = ctx.createLinearGradient(textX, 0, textX + 80 * scale, 0);
      textGradient.addColorStop(0, '#8B5CF6');
      textGradient.addColorStop(1, '#3B82F6');

      ctx.font = `bold ${13 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = textGradient;
      const englishWidth = ctx.measureText('ClawPlanet').width;
      ctx.fillText('ClawPlanet', textX, 22 * scale);

      ctx.font = `bold ${15 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;

      const chineseText = '虾 蛋 星 球';
      const chineseWidth = ctx.measureText(chineseText).width;
      const startX = textX + (englishWidth - chineseWidth) / 2;
      ctx.fillText(chineseText, startX, 44 * scale);
      ctx.globalAlpha = 1;

      ctx.restore();
    };

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawRing(true);
      drawPlanet();
      drawRing(false);

      const lobsterX = Math.cos(angle) * rx;
      const lobsterY = Math.sin(angle) * ry;
      drawLobster(lobsterX, lobsterY);

      drawText();

      angle += 0.005;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showLogo]);

  return (
    <div className="fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: '#050508' }}
      />
      {showLogo && (
        <canvas
          ref={logoCanvasRef}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6))',
          }}
        />
      )}
    </div>
  );
}
