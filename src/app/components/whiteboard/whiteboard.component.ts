import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import rough from 'roughjs';
import { FormsModule } from '@angular/forms';
import { Tool, WhiteboardElement } from 'src/app/models/white-board.model';
import { ShapeRenderer } from 'src/app/service/shape-renderer.service';
import { HistoryManager } from 'src/app/service/history-manager.service';
import { HitTester } from 'src/app/service/hit-tester.service';
import { WhiteboardStateService } from 'src/app/service/white-board-state.service';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

  elements: WhiteboardElement[] = [];

  private ctx!: CanvasRenderingContext2D;
  private renderer!: ShapeRenderer;
  private hitTester = new HitTester();
  private history = new HistoryManager();

  private drawing = false;
  private startX = 0;
  private startY = 0;

  isWriting = false;
  writeText = '';
  writeX = 0;
  writeY = 0;

  currentPoints: { x: number, y: number }[] = [];

  constructor(public state: WhiteboardStateService) { }

  ngOnInit() {
    const canvas = this.canvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    const rc = rough.canvas(canvas);
    this.renderer = new ShapeRenderer(this.ctx, rc, rc.generator);
    this.resizeCanvas();
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const c = this.canvas.nativeElement;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    this.redraw();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent) {
    // If user is typing in the text box, let the browser handle native Undo/Redo for text
    if (this.isWriting) return;

    // Ctrl (Windows) or Meta (Mac Command key)
    const isCmdOrCtrl = event.ctrlKey || event.metaKey;

    if (isCmdOrCtrl) {
      const key = event.key.toLowerCase();

      // REDO (Cmd+Shift+Z  OR  Ctrl+Y)
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault(); // Stop browser default
        this.redo();
      }
      // UNDO
      else if (key === 'z') {
        event.preventDefault();
        this.undo();
      }
    }
  }



  onMouseDown(e: MouseEvent) {
    if (this.isWriting) return;

    const { clientX, clientY } = e;
    this.drawing = true;
    const currentTool = this.state.currentTool;
    this.startX = clientX;
    this.startY = clientY;

    if (currentTool === 'pencil') {
      this.currentPoints = [{ x: clientX, y: clientY }];
      return;
    }

    if (currentTool === 'eraser') {
      this.eraseAt(clientX, clientY);
      return;
    }
    if (currentTool === 'text') {
      this.isWriting = true;
      this.writeX = clientX;
      this.writeY = clientY;
      this.drawing = false;
      setTimeout(() => this.textArea.nativeElement.focus());
      return;
    }

  }

  onMouseMove(e: MouseEvent) {
    if (!this.drawing) return;
    const currentTool = this.state.currentTool

    if (currentTool === 'pencil') {

      this.currentPoints.push({ x: e.clientX, y: e.clientY });

      this.renderer.draw({
        type: 'pencil',
        points: this.currentPoints,
        options: { ...this.state.currentStyle }
      });

      return;
    }

    if (currentTool === 'eraser') {
      this.eraseAt(e.clientX, e.clientY);
      return;
    }

    // redraw to see the transition
    this.redraw();

    // Temporary shape
    const previewElement: any = {
      type: currentTool,
      x: this.startX,
      y: this.startY,
      width: e.clientX - this.startX,
      height: e.clientY - this.startY,
      endX: e.clientX,
      endY: e.clientY,
      options: { ...this.state.currentStyle }
    };

    // Draw temporary shape
    this.renderer.draw(previewElement);
  }

  onMouseUp(e: MouseEvent) {
    if (!this.drawing) return;

    this.drawing = false;
    const currentTool = this.state.currentTool;

    if (currentTool === 'eraser') return;

    let newElement: WhiteboardElement;

    if (currentTool === 'pencil') {
      if (!this.currentPoints.length) return;
      newElement = {
        type: 'pencil',
        x: 0, y: 0,
        points: [...this.currentPoints],
        options: { ...this.state.currentStyle }
      };
    } else {
      newElement = {
        type: currentTool,
        x: this.startX,
        y: this.startY,
        width: e.clientX - this.startX,
        height: e.clientY - this.startY,
        endX: e.clientX,
        endY: e.clientY,
        roughElement: null,
        options: { ...this.state.currentStyle }
      };
    }

    this.elements.push(newElement);
    this.history.track({ type: 'add', element: newElement });

    this.currentPoints = [];
    this.redraw();
  }

  onTextBlur() {
    if (this.writeText.trim()) {

      this.ctx.font = `${12 + (this.state.currentStyle.strokeWidth * 4)}px "Segoe UI"`;
      const metrics = this.ctx.measureText(this.writeText);
      const textHeight = 12 + (this.state.currentStyle.strokeWidth * 4);

      const newElement: WhiteboardElement = {
        type: 'text',
        x: this.writeX,
        y: this.writeY,
        text: this.writeText,
        width: metrics.width,
        height: textHeight,
        options: { ...this.state.currentStyle }
      };
      this.elements.push(newElement);
      this.history.track({ type: 'add', element: newElement });
    }

    this.isWriting = false;
    this.writeText = '';
    this.redraw();
  }

  undo() {
    this.elements = this.history.undo(this.elements) || [];
    this.redraw();
  }

  redo() {
    this.elements = this.history.redo(this.elements) || [];
    this.redraw();
  }

  redraw() {
    const c = this.canvas.nativeElement;
    // Clearing a huge area to remove everything
    this.ctx.clearRect(0, 0, c.width, c.height);
    this.elements.forEach(e => this.renderer.draw(e));
  }

  eraseAt(x: number, y: number) {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      if (this.hitTester.isWithinElement(x, y, this.elements[i])) {
        const removedElement = this.elements[i];
        this.history.track({
          type: 'remove',
          element: removedElement,
          index: i
        });
        this.elements.splice(i, 1);
        this.redraw();
        break; 
      }
    }
  }

  isShape(tool: Tool) {
    return ['rectangle', 'circle'].includes(tool);
  }

  updateStroke(e: any) {
    this.state.updateStyle({ stroke: e.target.value });
  }
  setStroke(color: string) {
    this.state.updateStyle({ stroke: color });
  }

  updateFill(e: any) {
    this.state.updateStyle({ fill: e.target.value });
  }
  setFill(color: string) {
    this.state.updateStyle({ fill: color });
  }

  updateWidth(e: any) {
    this.state.updateStyle({ strokeWidth: +e.target.value });
  }

  downloadCanvas() {
    const canvas = this.canvas.nativeElement;

    //  'destination-over' =>To draw the background behind the existing canvas content.
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.fillStyle = '#121212';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = imageData;
    link.click();

    //  Restore default drawing mode (new shapes on top of old ones)
    this.ctx.globalCompositeOperation = 'source-over';
    
    this.redraw();
  }
}
