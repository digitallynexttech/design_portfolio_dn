// Builds the water's shapes off the main thread: tens of thousands of points each, which would
// otherwise hold up a frame while the visitor scrolls. The arrays are transferred back, not copied.
import { buildShape, type FormId } from "./shapes";

type Request = { id: number; form: FormId; count: number };
type WorkerScope = { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage(message: unknown, transfer?: Transferable[]): void };

const scope = self as unknown as WorkerScope;
scope.onmessage = ({ data: { id, form, count } }) => {
  buildShape(form, count).then(
    (shape) => scope.postMessage({ id, shape }, [shape.positions.buffer, shape.colors.buffer, shape.normals.buffer]),
    (error: unknown) => scope.postMessage({ id, error: String(error) }),
  );
};
