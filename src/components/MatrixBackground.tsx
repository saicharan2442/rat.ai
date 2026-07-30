import React, { useEffect, useRef } from 'react';

export const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Matrix binary rain parameters
    const fontSize = 13;
    // Tightly packed columns for seamless screen-wide binary downpour
    const columnWidth = 11;
    const columns = Math.ceil(canvas.width / columnWidth);

    // Each column maintains a continuous binary stream with head row, length, speed, and characters
    const rainColumns = Array.from({ length: columns }, () => {
      const length = Math.floor(Math.random() * 30) + 25; // 25 to 55 characters long stream
      return {
        y: Math.random() * -60, // staggered initial row
        length,
        speed: Math.random() * 0.45 + 0.35, // fall speed in rows per frame
        chars: Array.from({ length }, () => (Math.random() > 0.5 ? '1' : '0')),
      };
    });

    // Ambient background cyan light nodes
    const nodes = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      glowRadius: Math.random() * 160 + 60,
      opacity: Math.random() * 0.3 + 0.1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      // Smooth dark canvas fade for glowing trail effect
      ctx.fillStyle = 'rgba(2, 11, 22, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render ambient background dim cyan glows
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        const radial = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.glowRadius);
        radial.addColorStop(0, `rgba(0, 180, 220, ${node.opacity * 0.2})`);
        radial.addColorStop(0.5, `rgba(0, 120, 180, ${node.opacity * 0.08})`);
        radial.addColorStop(1, 'rgba(2, 11, 22, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = radial;
        ctx.fill();
      });

      // Render thick falling binary rain (0 and 1) without vertical gaps
      ctx.font = `600 ${fontSize}px "Courier New", monospace`;

      rainColumns.forEach((col, i) => {
        const x = i * columnWidth;
        const headRow = Math.floor(col.y);

        // Periodically mutate random character in column for dynamic binary glitching
        if (Math.random() < 0.3) {
          const randIdx = Math.floor(Math.random() * col.length);
          col.chars[randIdx] = Math.random() > 0.5 ? '1' : '0';
        }

        // Draw vertical stream of binary digits for this column
        for (let j = 0; j < col.length; j++) {
          const charRow = headRow - j;
          const charY = charRow * fontSize;

          if (charY < -fontSize || charY > canvas.height + fontSize) continue;

          const char = col.chars[j] || (Math.random() > 0.5 ? '1' : '0');

          if (j === 0) {
            // Stream head: Glowing brilliant white-cyan tip
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
          } else if (j < 4) {
            // Bright leading cyan
            ctx.fillStyle = '#00e5ff';
            ctx.shadowColor = '#00a3e0';
            ctx.shadowBlur = 4;
          } else {
            // Smoothly fading trailing binary stream
            const alpha = Math.max(0.08, (1 - (j / col.length)) * 0.6);
            ctx.fillStyle = `rgba(0, 195, 230, ${alpha})`;
            ctx.shadowBlur = 0;
          }

          ctx.fillText(char, x, charY);
        }

        // Advance column downwards
        col.y += col.speed;

        // When stream passes screen bottom, seamlessly restart above top
        if ((col.y - col.length) * fontSize > canvas.height) {
          col.y = Math.random() * -15;
          col.speed = Math.random() * 0.45 + 0.35;
          col.length = Math.floor(Math.random() * 30) + 25;
        }
      });

      ctx.shadowBlur = 0; // reset shadow effect

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none select-none bg-[#020b14]"
      id="matrix-bg-canvas"
    />
  );
};

