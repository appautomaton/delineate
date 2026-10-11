// OpenCV, compiled to WebAssembly. Load it once with `await opencv()`.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let ready: Promise<any> | undefined;

export function opencv(): Promise<any> {
  // The Emscripten module is a thenable that resolves to itself; dropping `then` lets it be awaited.
  ready ??= new Promise((resolve) =>
    require("@techstark/opencv-js").then((cv: any) => {
      delete cv.then;
      resolve(cv);
    }),
  );
  return ready;
}
