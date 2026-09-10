import type { SampleImage } from "../types";
export const SAMPLE_IMAGE_REPOSITORY =
  "https://github.com/yavuzceliker/sample-images/tree/main/docs";
export const SAMPLE_IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yavuzceliker/sample-images/main/docs";
export const SAMPLE_IMAGE_COUNT = 2000;
const IMAGE_DERIVATIVE_VERSION = "1";
export const sampleImages: SampleImage[] = Array.from(
  { length: SAMPLE_IMAGE_COUNT },
  (_, index) => {
    const name = `image-${index + 1}.jpg`;
    return { name, url: `${SAMPLE_IMAGE_BASE_URL}/${name}` };
  },
);
export function sampleImageForNumber(number: number): SampleImage {
  return sampleImages[(number - 1) % SAMPLE_IMAGE_COUNT]!;
}
export function sampleImageForSeed(seed: string): SampleImage {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return sampleImages[hash % SAMPLE_IMAGE_COUNT]!;
}
export function optimizedImageUrl(
  image: SampleImage,
  width: 320 | 640 | 1280,
  format: "avif" | "webp",
): string {
  return `/api/images/${encodeURIComponent(image.name)}?${new URLSearchParams({ v: IMAGE_DERIVATIVE_VERSION, width: String(width), format })}`;
}
export function optimizedImageSrcSet(
  image: SampleImage,
  format: "avif" | "webp",
): string {
  return ([320, 640, 1280] as const)
    .map((width) => `${optimizedImageUrl(image, width, format)} ${width}w`)
    .join(", ");
}
