import { useRef, useEffect } from "react";

let once = true;

//* TODO update typing for EVERYTHING that's red


export function useOnDraw(onDraw: Function) {

    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const prevPointRef = useRef(null);

    const mouseMoveListenerRef = useRef(null);
    const mouseUpListenerRef = useRef(null);

    function setCanvasRef(ref: any) {
        canvasRef.current = ref;
        return canvasRef;
    }

    function onCanvasMouseDown() {
        isDrawingRef.current = true;
    }



    useEffect(() => {
        function enableGrid(isEnabled: boolean = true) {
            const ctx = (canvasRef.current as any).getContext("2d");
            const image = new Image();

            if (!isEnabled) return;
            if (!ctx) return;
            image.src = "https://i.stack.imgur.com/f6vGv.png";
            image.onload = function () {
                ctx.globalAlpha = 0.8;
                ctx!.drawImage(image, 0, 0, window.innerWidth, innerHeight);
                ctx.globalAlpha = 1.0;
            }

        }

        function computePointInCanvas(clientX: number, clientY: number) {
            if (canvasRef.current) {
                const boundingRect = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
                return {
                    x: clientX - boundingRect.left,
                    y: clientY - boundingRect.top
                }
            } else {
                return null;
            }

        }
        function initMouseMoveListener() {
            const mouseMoveListener = (e: MouseEvent) => {
                if (isDrawingRef.current && canvasRef.current) {
                    const point = computePointInCanvas(e.clientX, e.clientY);
                    const ctx = (canvasRef.current as HTMLCanvasElement).getContext('2d');

                    if (onDraw) onDraw(ctx, point, prevPointRef.current);
                    //@ts-ignore
                    prevPointRef.current = point;
                    // console.log(point);
                }
            }
            (mouseMoveListenerRef.current as any) = mouseMoveListener;
            window.addEventListener("mousemove", mouseMoveListener);
        }
        function initMouseUpListener() {
            const listener = () => {
                isDrawingRef.current = false;
                prevPointRef.current = null;
            }
            (mouseMoveListenerRef.current as any) = listener;
            window.addEventListener("mouseup", listener);
        }
        function cleanup() {
            if (mouseMoveListenerRef.current) {
                window.removeEventListener("mousemove", mouseMoveListenerRef.current);
            }
            if (mouseUpListenerRef.current) {
                window.removeEventListener("mouseup", mouseUpListenerRef.current);
            }
        }

        if (once) {
            enableGrid();
            once = false;
        }
        initMouseMoveListener();
        initMouseUpListener();
        return () => cleanup();

    }, [onDraw]);

    return {
        setCanvasRef,
        onCanvasMouseDown
    }

};