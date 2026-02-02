import { getStroke } from 'perfect-freehand'; // <--- Import this

export class ShapeRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private rc: any,
    private generator: any
  ) { }

  draw(element: any) {

    if (!element.options) {
      element.options = { stroke: '#fff', strokeWidth: 2, fill: 'transparent', fillStyle: 'solid' };
    }

    if (element.type === 'pencil') {

      if (!element.points || element.points.length === 0) {
        return;
      }

      this.ctx.fillStyle = element.options.stroke;

      const outlinePoints = getStroke(element.points, {
        size: element.options.strokeWidth * 2,
        thinning: 0.5, 
        smoothing: 0.5,
        streamline: 0.5,
      });

      const pathData = this.getSvgPathFromStroke(outlinePoints);
      const myPath = new Path2D(pathData);

      this.ctx.fill(myPath);
      return;
    }

    if (element.type === 'text') {
      if (!element.text) return;

      this.ctx.font = `${12 + (element.options.strokeWidth * 4)}px "Segoe UI"`;
      this.ctx.fillStyle = element.options.stroke;
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(element.text, element.x, element.y);
      return;
    }

    if (!element.roughElement) {

      if (element.type === 'rectangle') {
        element.roughElement = this.generator.rectangle(
          element.x,
          element.y,
          element.width,
          element.height,
          element.options
        );
      }

      if (element.type === 'line') {
        element.roughElement = this.generator.line(
          element.x,
          element.y,
          element.endX,
          element.endY,
          element.options
        );
      }

      if (element.type === 'circle') {
        const diameter = Math.sqrt(element.width ** 2 + element.height ** 2);
        // (x,y, diameter) => center, diameter
        element.roughElement = this.generator.circle(
          element.x + element.width / 2,
          element.y + element.height / 2,
          diameter,
          element.options
        );
      }

      if (element.type === 'arrow') {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.endX;
        const y2 = element.endY;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 20; // Length of the blades

        // Blade 1: Rotate -30 degrees (PI/6)
        const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);

        // Blade 2: Rotate +30 degrees (PI/6)
        const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);

        element.roughElement = [
          this.generator.line(x1, y1, x2, y2, element.options), // Main line
          this.generator.line(x2, y2, x3, y3, element.options), // Blade 1
          this.generator.line(x2, y2, x4, y4, element.options)  // Blade 2
        ];
      }

    }

    if (element.roughElement) {
      if (Array.isArray(element.roughElement)) {
        element.roughElement.forEach((s: any) => this.rc.draw(s));
      } else {
        this.rc.draw(element.roughElement);
      }
    }
  }

  private getSvgPathFromStroke(stroke: any) {
    if (!stroke.length) return '';

    const d = stroke.reduce(
      (acc: any, [x0, y0]: any, i: number, arr: any[]) => {
        // Get the NEXT point in the array (wrapping around to the start with modulo %)
        const [x1, y1] = arr[(i + 1) % arr.length];

        // Push the command to the accumulator array:
        //    x0, y0         -> The Control Point (Current Point)
        //    (x0+x1)/2, ... -> The End Point (Midpoint between Current and Next)
        acc.push(x0, y0, (x0 + x1) / 2, (y1 + y0) / 2);
        return acc;
      },

      ['M', ...stroke[0], 'Q']
    );

    d.push('Z');

    // A string like M 100 100 Q 105 105 110 100 ... Z.
    // M: Move to start.
    //Q: Draw a smooth curve.
    //Z: Close the shape so it can be filled with color.
    return d.join(' ');
  }
}
