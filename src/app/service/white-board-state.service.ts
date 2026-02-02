import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tool, ShapeStyle } from '../models/white-board.model';

@Injectable({
  providedIn: 'root'
})
export class WhiteboardStateService {

  private defaultStyle: ShapeStyle = {
    stroke: '#ffffff',
    fill: 'transparent',
    strokeWidth: 2,
    fillStyle: 'solid',
    seed: 1,
    roughness: 1
  };

  private toolStyles: Record<string, ShapeStyle> = {
    line: { ...this.defaultStyle },
    rectangle: { ...this.defaultStyle },
    circle: { ...this.defaultStyle },
    arrow: { ...this.defaultStyle },
    text: { ...this.defaultStyle, strokeWidth: 1 },
    eraser: { ...this.defaultStyle },
    pencil: { ...this.defaultStyle }
  };

  private _tool = new BehaviorSubject<Tool>('line');
  private _style = new BehaviorSubject<ShapeStyle>(this.toolStyles['line']);

  tool$ = this._tool.asObservable();
  style$ = this._style.asObservable();

  get currentTool() { return this._tool.value; }
  get currentStyle() { return this._style.value; }

  setTool(tool: Tool) {
    this._tool.next(tool);
    if (this.toolStyles[tool]) {
      this._style.next(this.toolStyles[tool]);
    }
  }

  updateStyle(changes: Partial<ShapeStyle>) {
    const currentTool = this.currentTool;
    const updatedStyle = { ...this.toolStyles[currentTool], ...changes };
    this.toolStyles[currentTool] = updatedStyle;
    this._style.next(updatedStyle);
  }
}