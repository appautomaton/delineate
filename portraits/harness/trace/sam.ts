// Promptable segmentation with Segment Anything (Kirillov et al., 2023), run locally through
// ONNX. The picture is encoded once; then each prompt (points inside a thing, and points outside
// it) returns that thing's mask as logits at full resolution, positive inside.
//
// Weights download on first use into .cache/models and are reused from there.

import { fileURLToPath } from "node:url";
import { AutoProcessor, RawImage, SamModel, env } from "@huggingface/transformers";

env.cacheDir = fileURLToPath(new URL("../../../.cache/models", import.meta.url));

// ViT-B, the smallest original SAM, in half precision: it agrees with full precision on 99.6% of
// this project's pixels at half the size, where the 8-bit build loses whole parts.
const MODEL = "Xenova/sam-vit-base";

export type Prompt = {
  points?: [number, number][]; // inside the thing
  outside?: [number, number][]; // not part of it
};

export type Candidate = { logits: Float32Array; score: number };

// `masks` returns the model's three readings of a prompt (a part, a whole, a larger whole), each
// with the model's own estimate of its quality; `logits` returns the best of them.
export type Segmenter = { width: number; height: number; masks(prompt: Prompt): Promise<Candidate[]>; logits(prompt: Prompt): Promise<Float32Array> };

export async function segmenter(path: string): Promise<Segmenter> {
  const model: any = await SamModel.from_pretrained(MODEL, { dtype: "fp16" });
  const processor: any = await AutoProcessor.from_pretrained(MODEL);
  const image = await RawImage.read(path);
  const base = await processor(image);
  const embeddings = await model.get_image_embeddings(base);
  const { width, height } = image;
  const n = width * height;

  async function masks({ points = [], outside = [] }: Prompt): Promise<Candidate[]> {
    const inputs = await processor(image, { input_points: [[[...points, ...outside]]], input_labels: [[[...points.map(() => 1), ...outside.map(() => 0)]]] });
    const out = await model({ ...embeddings, input_points: inputs.input_points, input_labels: inputs.input_labels });
    const [all] = await processor.post_process_masks(out.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes, { binarize: false });
    const scores: number[] = Array.from(out.iou_scores.data as Float32Array);
    return scores.map((score, k) => ({ score, logits: Float32Array.from((all.data as Float32Array).subarray(k * n, (k + 1) * n)) }));
  }

  return {
    width,
    height,
    masks,
    async logits(prompt) {
      const all = await masks(prompt);
      return all.reduce((a, b) => (b.score > a.score ? b : a)).logits;
    },
  };
}
