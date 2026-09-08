export const SAMPLE_IMAGE_REPOSITORY = "https://github.com/yavuzceliker/sample-images/tree/main/docs";
export const SAMPLE_IMAGE_BASE_URL = "https://raw.githubusercontent.com/yavuzceliker/sample-images/main/docs";
export const SAMPLE_IMAGE_COUNT = 2000;

export const sampleImages = Array.from({ length: SAMPLE_IMAGE_COUNT }, (_, index) => {
  const number = index + 1;
  const name = `image-${number}.jpg`;

  return {
    name,
    url: `${SAMPLE_IMAGE_BASE_URL}/${name}`
  };
});

export function sampleImageForNumber(number) {
  return sampleImages[(number - 1) % SAMPLE_IMAGE_COUNT];
}

export function sampleImageForSeed(seed) {
  const text = String(seed);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return sampleImages[hash % SAMPLE_IMAGE_COUNT];
}
