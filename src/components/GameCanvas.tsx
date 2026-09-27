import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { audio } from '../game/audio';

interface GameCanvasProps {
  engine: GameEngine;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onOpenNPC: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onOpenInventory,
  onOpenJournal,
  onOpenNPC,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({
    x: 0,
    y: 0,
    isDown: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new GameRenderer(canvas);
    rendererRef.current = renderer;

    // Handle container resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          renderer.resize(Math.floor(width), Math.floor(height));
        }
      }
    });
    resizeObserver.observe(container);

    // KEYBOARD EVENT LISTENERS
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio starts on first user action
      audio.startMusic();

      keysRef.current[e.code] = true;

      // Jump (Space)
      if (e.code === 'Space') {
        e.preventDefault();
        engine.handleJump();
      }

      // Dash (ShiftLeft or ShiftRight)
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        engine.handleDash();
      }

      // Attack (KeyJ)
      if (e.code === 'KeyJ') {
        const dir = keysRef.current['KeyW'] || keysRef.current['ArrowUp']
          ? 'up'
          : keysRef.current['KeyS'] || keysRef.current['ArrowDown']
          ? 'down'
          : 'forward';
        engine.handleAttack(dir);
      }

      // Parry (KeyQ)
      if (e.code === 'KeyQ') {
        engine.handleParry();
      }

      // Spell (KeyL)
      if (e.code === 'KeyL') {
        engine.handleCastSpell();
      }

      // Heal (KeyH)
      if (e.code === 'KeyH') {
        engine.handleFocusHeal();
      }

      // Dig (KeyK)
      if (e.code === 'KeyK') {
        engine.handleDig(engine.hoveredTileX, engine.hoveredTileY);
      }

      // Place / Build (KeyB)
      if (e.code === 'KeyB') {
        engine.handlePlace(engine.hoveredTileX, engine.hoveredTileY);
      }

      // Hotbar numbers 1-8
      if (e.code >= 'Digit1' && e.code <= 'Digit8') {
        const slot = parseInt(e.code.replace('Digit', '')) - 1;
        engine.player.selectedHotbarIndex = slot;
      }

      // Open Inventory (KeyC)
      if (e.code === 'KeyC') {
        onOpenInventory();
      }

      // Open Journal / Map (KeyM or Tab)
      if (e.code === 'KeyM' || e.code === 'Tab') {
        e.preventDefault();
        onOpenJournal();
      }

      // Interact with NPC (KeyE)
      if (e.code === 'KeyE') {
        if (engine.nearbyNPC) {
          // If no speech bubble is active for this NPC, show speech bubble above NPC first
          if (!engine.activeSpeechBubble || engine.activeSpeechBubble.npcId !== engine.nearbyNPC.id) {
            engine.triggerNPCSpeech(engine.nearbyNPC);
          } else {
            // Second press opens the full dialog/trade modal
            onOpenNPC();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    // MOUSE EVENT LISTENERS
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      audio.startMusic();
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (e.button === 0) {
        // Left click
        mouseRef.current.isDown = true;
        const currentItem = engine.player.inventory[engine.player.selectedHotbarIndex];

        // If weapon or empty, do attack; if pickaxe, dig; if placeable, place!
        if (currentItem?.type === 'weapon' || !currentItem) {
          const dir = keysRef.current['KeyW'] || keysRef.current['ArrowUp']
            ? 'up'
            : keysRef.current['KeyS'] || keysRef.current['ArrowDown']
            ? 'down'
            : 'forward';
          engine.handleAttack(dir);
        } else if (currentItem?.type === 'tool') {
          engine.handleDig(engine.hoveredTileX, engine.hoveredTileY);
        } else if (currentItem?.type === 'placeable') {
          engine.handlePlace(engine.hoveredTileX, engine.hoveredTileY);
        }
      } else if (e.button === 2) {
        // Right click -> Parry
        e.preventDefault();
        engine.handleParry();
      }
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // GAME LOOP
    let animationFrameId: number;
    const loop = () => {
      engine.update(keysRef.current, mouseRef.current);
      renderer.render(engine, mouseRef.current);
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [engine, onOpenInventory, onOpenJournal, onOpenNPC]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black select-none cursor-crosshair"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
