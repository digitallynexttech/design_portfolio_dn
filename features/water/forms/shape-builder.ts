import { buildShape, type FormId, type Shape } from "./shapes";

type Reply = { id: number; shape?: Shape; error?: string };

/**
 * Builds shapes in a worker, so a 48k-point shape never costs the page a frame. Where a worker can't
 * start, it builds them here instead, exactly the same way.
 */
export function createShapeBuilder() {
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL("./shapes.worker.ts", import.meta.url), { type: "module" });
  } catch {
    worker = null;
  }
  let next = 0;
  const waiting = new Map<number, { form: FormId; count: number; resolve: (shape: Shape) => void; reject: (error: Error) => void }>();
  const local = (form: FormId, count: number) => buildShape(form, count);

  if (worker) {
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      const job = waiting.get(data.id);
      if (!job) return;
      waiting.delete(data.id);
      if (data.shape) job.resolve(data.shape);
      else job.reject(new Error(data.error ?? "shape failed"));
    };
    // If the worker itself fails, finish everything it was asked for here.
    worker.onerror = (event) => {
      event.preventDefault();
      worker?.terminate();
      worker = null;
      for (const [id, job] of waiting) {
        waiting.delete(id);
        local(job.form, job.count).then(job.resolve, job.reject);
      }
    };
  }

  return {
    build(form: FormId, count: number): Promise<Shape> {
      if (!worker) return local(form, count);
      const id = next++;
      return new Promise<Shape>((resolve, reject) => {
        waiting.set(id, { form, count, resolve, reject });
        worker!.postMessage({ id, form, count });
      });
    },
    dispose() {
      worker?.terminate();
      worker = null;
      waiting.clear();
    },
  };
}
