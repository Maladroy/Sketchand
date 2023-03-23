//@ts-nocheck
import { useEffect, useContext } from 'react';
import { useOnDraw } from '../hooks';
import { HandContext } from '../context';

export const DrawCanvas = ({
  width,
  height,
  isBuffering,
}: {
  width: number;
  height: number;
  isBuffering: boolean;
}) => {
  const { setCanvasRef, onCanvasMouseDown } = useOnDraw(onDraw);
  const localCanvasRef = setCanvasRef();
  const { handCoords } = useContext(HandContext);

  function onDraw(
    ctx: CanvasRenderingContext2D,
    point: number,
    prevPoint: number
  ) {
    drawLine(prevPoint, point, ctx, '#000000', 5);
  }

  function drawLine(start, end, ctx, color, width) {
    start = start ?? end;
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  useEffect(() => {
    // simulate mouse movement event
    // * TODO REFACTOR THIS
    // * drawing need a delay buffer
    var MouseMoveEvent = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: handCoords.x,
      clientY: handCoords.y,
    });

    var MouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: handCoords.x,
      clientY: handCoords.y,
    });

    var MouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: handCoords.x,
      clientY: handCoords.y,
    });

    localCanvasRef.current.dispatchEvent(MouseMoveEvent);

    if (handCoords.type === 'draw' && isBuffering) {
      localCanvasRef.current.dispatchEvent(MouseDownEvent);
    }
    if (handCoords.type !== 'draw') {
      localCanvasRef.current.dispatchEvent(MouseUpEvent);
    }
  }, [handCoords]);

  return (
    <canvas
      className="absolute top-0 left-0 z-10"
      ref={setCanvasRef}
      onMouseDown={onCanvasMouseDown}
      width={width}
      height={height}
    ></canvas>
  );
};
