import { useRef, Ref } from "react";

let once = true;


export function useOnDraw(onDraw: Function): Ref<HTMLCanvasElement> {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    function setCanvasRef(ref: HTMLCanvasElement | null) {
        // run only once, to avoid re-rendering
        // also because the whole page probably re-render every 10ms
        // so yeah...
        if (!once || !ref) return;

        canvasRef.current = ref;
        initHandListener();
        enableGrid();
        once = false;
    }

    function enableGrid(isEnabled: boolean = true) {
        const ctx = canvasRef.current?.getContext("2d");
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

    function initHandListener() {
        const handListener = (e: MouseEvent) => {
            const point = computePointInCanvas(e.clientX, e.clientY);
            const ctx = canvasRef.current?.getContext("2d");

            if (onDraw) onDraw(ctx, point);

            console.log(point);
        }
        window.addEventListener("mousemove", handListener);
    }

    function computePointInCanvas(clientX: number, clientY: number): { x: number, y: number } | null {
        if (!canvasRef.current) return null;
        const boundingRect = canvasRef.current?.getBoundingClientRect();

        return {
            x: clientX - boundingRect!.left,
            y: clientY - boundingRect!.top
        }
    }

    return setCanvasRef
} 