export function diff(x: number[], y: number[]): number {
    const x1 = x[0], x2 = x[1], y1 = y[0], y2 = y[1];

    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// check if x is the largest number in y set of numbers
export function isLargest(x: number, y: number[]): boolean {
    return Math.max(...y, x) === x;
}

export function once(fn: Function): Function {
    var done = false;
    return function (...args: any) {
        if (!done) {
            done = true;
            //@ts-ignore
            return fn.apply(this, args);
        }
    }
}