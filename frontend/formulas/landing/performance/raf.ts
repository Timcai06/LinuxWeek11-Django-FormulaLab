type PointerWriterOptions = {
  target: HTMLElement;
  xVar: string;
  yVar: string;
};

export function createRafThrottledPointerWriter({ target, xVar, yVar }: PointerWriterOptions) {
  let frame = 0;
  let lastX = 0;
  let lastY = 0;

  const write = () => {
    frame = 0;
    target.style.setProperty(xVar, `${lastX}px`);
    target.style.setProperty(yVar, `${lastY}px`);
  };

  return {
    schedule(event: MouseEvent) {
      lastX = event.clientX;
      lastY = event.clientY;
      if (!frame) {
        frame = requestAnimationFrame(write);
      }
    },
    cancel() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
  };
}
