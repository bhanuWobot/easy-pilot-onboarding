/**
 * ROI Canvas Component
 * Canvas-based drawing toolkit for creating and editing ROI shapes on camera frames
 * Supports: rectangle, circle, polygon, line, arrow
 * Features: draw, select, move, resize, delete, comment
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ROIProfile, ROIDrawing, ROIShapeType } from '../../types/roi';

export type DrawingTool = ROIShapeType | 'select' | 'none';

interface Point {
  x: number;
  y: number;
}

interface ROICanvasProps {
  frameUrl: string;
  profiles: ROIProfile[];
  activeProfile: ROIProfile | null;
  activeTool: DrawingTool;
  selectedColor: string;
  onDrawingComplete: (drawing: Omit<ROIDrawing, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDrawingSelect: (drawing: ROIDrawing | null, profileId: string | null) => void;
  selectedDrawing: ROIDrawing | null;
  onCanvasClick?: (point: Point) => void;
}

export function ROICanvas({
  frameUrl,
  profiles,
  activeProfile,
  activeTool,
  selectedColor,
  onDrawingComplete,
  onDrawingSelect,
  selectedDrawing,
  onCanvasClick,
}: ROICanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredDrawing] = useState<ROIDrawing | null>(null);
  const [hoveredComment, setHoveredComment] = useState<{ shape: ROIDrawing; position: Point } | null>(null);

  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate canvas size maintaining aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 800;
      const maxHeight = 600;
      
      let width = img.width;
      let height = img.height;
      
      // Scale down if needed
      if (width > containerWidth) {
        const ratio = containerWidth / width;
        width = containerWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }
      
      setCanvasSize({ width, height });
      canvas.width = width;
      canvas.height = height;
      
      redrawCanvas();
    };
    
    img.src = frameUrl;
  }, [frameUrl]);

  // Redraw canvas when data changes
  useEffect(() => {
    redrawCanvas();
  }, [profiles, selectedDrawing, hoveredDrawing, currentPoints, canvasSize]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw all visible ROI profiles
    profiles.forEach(profile => {
      if (!profile.visible) return;

      profile.shapes.forEach(shape => {
        const isSelected = selectedDrawing?.id === shape.id;
        const isHovered = hoveredDrawing?.id === shape.id;
        
        drawShape(ctx, shape, shape.color, isSelected, isHovered);
      });
    });

    // Draw current drawing in progress
    if (isDrawing && currentPoints.length > 0 && activeProfile) {
      drawCurrentDrawing(ctx, selectedColor);
    }
  }, [profiles, selectedDrawing, hoveredDrawing, currentPoints, isDrawing, activeProfile]);

  const pixelToPercent = (point: Point): Point => {
    return {
      x: (point.x / canvasSize.width) * 100,
      y: (point.y / canvasSize.height) * 100,
    };
  };

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: ROIDrawing,
    color: string,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    ctx.save();

    // Set style
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '20'; // 20% opacity for fill
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
    if (isSelected) {
      ctx.setLineDash([5, 5]);
    }

    const coords = shape.coordinates;

    switch (shape.type) {
      case 'rectangle': {
        const [x, y, w, h] = coords.map((c, i) => {
          if (i === 0 || i === 2) return (c / 100) * canvasSize.width;
          return (c / 100) * canvasSize.height;
        });
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        // Draw resize handles if selected
        if (isSelected) {
          drawResizeHandles(ctx, x, y, w, h);
        }
        break;
      }

      case 'circle': {
        const [cx, cy, r] = coords;
        const centerX = (cx / 100) * canvasSize.width;
        const centerY = (cy / 100) * canvasSize.height;
        const radius = (r / 100) * Math.min(canvasSize.width, canvasSize.height);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        if (isSelected) {
          // Draw center handle
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw radius handle
          ctx.beginPath();
          ctx.arc(centerX + radius, centerY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        break;
      }

      case 'polygon': {
        if (coords.length < 6) break; // Need at least 3 points
        
        ctx.beginPath();
        for (let i = 0; i < coords.length; i += 2) {
          const x = (coords[i] / 100) * canvasSize.width;
          const y = (coords[i + 1] / 100) * canvasSize.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        if (isSelected) {
          // Draw vertex handles
          for (let i = 0; i < coords.length; i += 2) {
            const x = (coords[i] / 100) * canvasSize.width;
            const y = (coords[i + 1] / 100) * canvasSize.height;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        break;
      }

      case 'line': {
        const [x1, y1, x2, y2] = coords;
        const startX = (x1 / 100) * canvasSize.width;
        const startY = (y1 / 100) * canvasSize.height;
        const endX = (x2 / 100) * canvasSize.width;
        const endY = (y2 / 100) * canvasSize.height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        if (isSelected) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        break;
      }

      case 'arrow': {
        const [x1, y1, x2, y2] = coords;
        const startX = (x1 / 100) * canvasSize.width;
        const startY = (y1 / 100) * canvasSize.height;
        const endX = (x2 / 100) * canvasSize.width;
        const endY = (y2 / 100) * canvasSize.height;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 15;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        
        if (isSelected) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        break;
      }
    }

    // Draw comment indicator if present - always visible
    if (shape.comment && shape.comment.trim().length > 0) {
      const firstPoint = getShapeFirstPoint(shape, canvasSize);
      
      // Draw a prominent comment badge
      const badgeX = firstPoint.x + 8;
      const badgeY = firstPoint.y - 8;
      const badgeSize = 20;
      
      // Draw white circle background
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw blue border
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw comment icon (emoji or text)
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#3B82F6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💬', badgeX, badgeY);
      
      // Reset text alignment
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      
      // Store badge position for hover detection (we'll check this in mousemove)
      (shape as any)._commentBadgePos = { x: badgeX, y: badgeY, radius: badgeSize / 2 };
    }

    ctx.restore();
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const handleSize = 6;
    const handles = [
      { x, y }, // Top-left
      { x: x + w, y }, // Top-right
      { x: x + w, y: y + h }, // Bottom-right
      { x, y: y + h }, // Bottom-left
    ];

    ctx.fillStyle = '#3B82F6';
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  };

  const drawCurrentDrawing = (ctx: CanvasRenderingContext2D, color: string) => {
    if (currentPoints.length === 0) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '20';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const points = currentPoints;

    switch (activeTool) {
      case 'rectangle': {
        if (points.length === 2) {
          const x = Math.min(points[0].x, points[1].x);
          const y = Math.min(points[0].y, points[1].y);
          const w = Math.abs(points[1].x - points[0].x);
          const h = Math.abs(points[1].y - points[0].y);
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }
        break;
      }

      case 'circle': {
        if (points.length === 2) {
          const dx = points[1].x - points[0].x;
          const dy = points[1].y - points[0].y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case 'polygon': {
        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
          
          // Draw vertices
          points.forEach(p => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
        break;
      }

      case 'line':
      case 'arrow': {
        if (points.length === 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
          ctx.stroke();
          
          if (activeTool === 'arrow') {
            // Draw arrowhead
            const angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
            const headLength = 15;
            
            ctx.beginPath();
            ctx.moveTo(points[1].x, points[1].y);
            ctx.lineTo(
              points[1].x - headLength * Math.cos(angle - Math.PI / 6),
              points[1].y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(points[1].x, points[1].y);
            ctx.lineTo(
              points[1].x - headLength * Math.cos(angle + Math.PI / 6),
              points[1].y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
        break;
      }
    }

    ctx.restore();
  };

  const getShapeFirstPoint = (shape: ROIDrawing, size: { width: number; height: number }): Point => {
    const coords = shape.coordinates;
    switch (shape.type) {
      case 'rectangle':
        return { x: (coords[0] / 100) * size.width, y: (coords[1] / 100) * size.height };
      case 'circle':
        return { x: (coords[0] / 100) * size.width, y: (coords[1] / 100) * size.height };
      case 'polygon':
      case 'line':
      case 'arrow':
        return { x: (coords[0] / 100) * size.width, y: (coords[1] / 100) * size.height };
      default:
        return { x: 0, y: 0 };
    }
  };

  const findShapeAtPoint = (point: Point): { shape: ROIDrawing; profileId: string } | null => {
    // Check shapes in reverse order (top to bottom)
    for (let i = profiles.length - 1; i >= 0; i--) {
      const profile = profiles[i];
      if (!profile.visible) continue;

      for (let j = profile.shapes.length - 1; j >= 0; j--) {
        const shape = profile.shapes[j];
        if (isPointInShape(point, shape)) {
          return { shape, profileId: profile.id };
        }
      }
    }
    return null;
  };

  const isPointInShape = (point: Point, shape: ROIDrawing): boolean => {
    const coords = shape.coordinates;
    
    switch (shape.type) {
      case 'rectangle': {
        const x = (coords[0] / 100) * canvasSize.width;
        const y = (coords[1] / 100) * canvasSize.height;
        const w = (coords[2] / 100) * canvasSize.width;
        const h = (coords[3] / 100) * canvasSize.height;
        return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
      }
      case 'circle': {
        const cx = (coords[0] / 100) * canvasSize.width;
        const cy = (coords[1] / 100) * canvasSize.height;
        const r = (coords[2] / 100) * Math.min(canvasSize.width, canvasSize.height);
        const distance = Math.sqrt((point.x - cx) ** 2 + (point.y - cy) ** 2);
        return distance <= r;
      }
      case 'line':
      case 'arrow': {
        const x1 = (coords[0] / 100) * canvasSize.width;
        const y1 = (coords[1] / 100) * canvasSize.height;
        const x2 = (coords[2] / 100) * canvasSize.width;
        const y2 = (coords[3] / 100) * canvasSize.height;
        // Check distance from point to line
        const distance = distanceToLineSegment(point, { x: x1, y: y1 }, { x: x2, y: y2 });
        return distance <= 5; // 5 pixel tolerance
      }
      case 'polygon': {
        // Ray casting algorithm for point-in-polygon
        let inside = false;
        const points: Point[] = [];
        for (let i = 0; i < coords.length; i += 2) {
          points.push({
            x: (coords[i] / 100) * canvasSize.width,
            y: (coords[i + 1] / 100) * canvasSize.height,
          });
        }
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const xi = points[i].x, yi = points[i].y;
          const xj = points[j].x, yj = points[j].y;
          
          const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }
      default:
        return false;
    }
  };

  const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over any comment badge
    let foundComment = false;
    for (const profile of profiles) {
      if (!profile.visible) continue;
      
      for (const shape of profile.shapes) {
        if (shape.comment && shape.comment.trim().length > 0) {
          const badgePos = (shape as any)._commentBadgePos;
          if (badgePos) {
            const dx = x - badgePos.x;
            const dy = y - badgePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= badgePos.radius) {
              setHoveredComment({ shape, position: { x: e.clientX, y: e.clientY } });
              foundComment = true;
              break;
            }
          }
        }
      }
      if (foundComment) break;
    }
    
    if (!foundComment) {
      setHoveredComment(null);
    }

    // Update cursor for polygon mode
    if (activeTool === 'polygon' && isDrawing) {
      // Show crosshair with preview line to cursor
      setCurrentPoints([...currentPoints]); // Trigger redraw
    }

    if (isDrawing && (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow')) {
      setCurrentPoints([currentPoints[0], { x, y }]);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle select tool - find clicked shape
    if (activeTool === 'select') {
      const clickedShape = findShapeAtPoint({ x, y });
      if (clickedShape) {
        onDrawingSelect(clickedShape.shape, clickedShape.profileId);
        // Pass viewport coordinates for comment popover (if handler exists)
        if (onCanvasClick) {
          onCanvasClick({ x: e.clientX, y: e.clientY });
        }
      } else {
        onDrawingSelect(null, null);
      }
      return;
    }

    // Handle drawing tools
    if (!activeProfile || activeTool === 'none') return;

    // For polygon, handle point addition
    if (activeTool === 'polygon') {
      if (!isDrawing) {
        // Start new polygon
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
      } else {
        // Add point to existing polygon
        const firstPoint = currentPoints[0];
        const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2);
        
        if (distance < 10 && currentPoints.length >= 3) {
          // Close polygon (clicked near first point)
          completeDrawing(currentPoints);
          setIsDrawing(false);
          setCurrentPoints([]);
        } else {
          // Add new point
          setCurrentPoints([...currentPoints, { x, y }]);
        }
      }
      return;
    }

    // For other shapes, start drawing
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Polygon handled in mouseDown
    if (activeTool === 'polygon') return;
    
    if (!isDrawing || !activeProfile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let finalPoints = [...currentPoints];

    switch (activeTool) {
      case 'rectangle':
      case 'circle':
      case 'line':
      case 'arrow': {
        finalPoints = [currentPoints[0], { x, y }];
        completeDrawing(finalPoints);
        break;
      }
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const completeDrawing = (points: Point[]) => {
    if (!activeProfile || points.length < 1) return;

    let coordinates: number[] = [];

    switch (activeTool) {
      case 'rectangle': {
        if (points.length !== 2) return;
        const p1 = pixelToPercent(points[0]);
        const p2 = pixelToPercent(points[1]);
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        coordinates = [x, y, w, h];
        break;
      }

      case 'circle': {
        if (points.length !== 2) return;
        const center = pixelToPercent(points[0]);
        const edge = pixelToPercent(points[1]);
        const dx = edge.x - center.x;
        const dy = edge.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        coordinates = [center.x, center.y, radius];
        break;
      }

      case 'polygon': {
        if (points.length < 3) return;
        coordinates = points.flatMap(p => {
          const percent = pixelToPercent(p);
          return [percent.x, percent.y];
        });
        break;
      }

      case 'line':
      case 'arrow': {
        if (points.length !== 2) return;
        const p1 = pixelToPercent(points[0]);
        const p2 = pixelToPercent(points[1]);
        coordinates = [p1.x, p1.y, p2.x, p2.y];
        break;
      }

      default:
        return;
    }

    onDrawingComplete({
      type: activeTool as ROIShapeType,
      coordinates,
      color: selectedColor as any, // Current selected color
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="border border-gray-300 rounded-lg cursor-crosshair"
        style={{ display: 'block', maxWidth: '100%' }}
      />
      
      {/* Comment Tooltip */}
      {hoveredComment && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none max-w-xs"
          style={{
            left: `${hoveredComment.position.x}px`,
            top: `${hoveredComment.position.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-medium truncate">{hoveredComment.shape.comment}</div>
          <div className="absolute left-1/2 top-full transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
