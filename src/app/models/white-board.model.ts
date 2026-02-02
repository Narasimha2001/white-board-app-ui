export type Tool = 'line' | 'rectangle' | 'circle' | 'text' | 'eraser' | 'arrow'| 'pencil';

export interface ShapeStyle {
  stroke: string;      // Line color
  fill: string;        // Background color (for shapes)
  strokeWidth: number; // Thickness
  seed: number;
  roughness: number;
  fillStyle: string;   // 'solid', 'hachure', etc.
}

export interface WhiteboardElement {
  type: Tool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  text?: string;
  points?: { x: number; y: number; pressure?: number }[];
  roughElement?: any;
  options: ShapeStyle;
}