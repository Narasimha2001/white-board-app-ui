import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class HitTester {
  isWithinElement(x: number, y: number, el: any): boolean {

    if (el.type === 'pencil' && el.points) {
      return el.points.some((p: any) =>
        Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10
      );
    }

    if (el.type === 'rectangle' || el.type === 'text') {
      const minX = Math.min(el.x, el.x + el.width);
      const maxX = Math.max(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxY = Math.max(el.y, el.y + el.height);

      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    if (el.type === 'circle') {
      const radius = Math.sqrt(Math.pow(el.width, 2) + Math.pow(el.height, 2)) / 2;
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;

      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      return dist <= radius;
    }

    if (el.type === 'line' || el.type === 'arrow') {
      const offset = 10; // Tolerance in pixels
      return this.distanceToLine(x, y, el.x, el.y, el.endX, el.endY) < offset;
    }

    return false;
  }

  private distanceToLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
