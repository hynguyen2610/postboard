import type { PostMedia } from "./models.js";

const SAMPLE_IMAGE_COUNT = 2000;

export function mediaForPostId(postId: string): PostMedia[] {
  let hash = 0;
  for (const character of postId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return [{ name: `image-${(hash % SAMPLE_IMAGE_COUNT) + 1}.jpg` }];
}
