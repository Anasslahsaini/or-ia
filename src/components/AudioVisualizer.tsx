import React, { useEffect, useRef } from 'react';

export const AudioVisualizer = ({ volume }: { volume: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Base line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      // If volume is very low, just draw a flat line
      if (volume < 0.01) {
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)'; // gray-600
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Draw wave based on volume
        for (let i = 0; i < width; i++) {
          // Amplitude based on volume (scaled up for visibility)
          const amplitude = Math.min(height / 2, volume * height * 2); 
          const frequency = 0.05;
          // Combine sine waves for organic look
          const y = height / 2 + 
            Math.sin(i * frequency + offset) * amplitude * Math.sin(i * 0.01) +
            Math.sin(i * 0.1 + offset * 2) * (amplitude * 0.5);
            
          ctx.lineTo(i, y);
        }

        ctx.strokeStyle = '#4F46E5'; // indigo-600
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      offset += 0.2;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg bg-black/5"
    />
  );
};
