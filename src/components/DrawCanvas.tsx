import { useContext, useEffect } from 'react';
import { useOnDraw } from '../hooks';
import { HandContext } from '../context';

export const DrawCanvas = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const { handCoords } = useContext(HandContext);
  const setCanvasRef = useOnDraw(() => {});

  useEffect(() => {
    // simulate mouse movement event
    console.log(setCanvasRef);

    if (!setCanvasRef.current) return;

    var event = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: handCoords.x,
      clientY: handCoords.y,
    });

    setCanvasRef.current.dispatchEvent(event);
  }, [handCoords]);

  return (
    <canvas
      className="absolute top-0 left-0 z-10"
      ref={setCanvasRef}
      width={width}
      height={height}
    ></canvas>
  );
};
