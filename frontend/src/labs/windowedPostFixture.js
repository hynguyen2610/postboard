const POST_COUNT = 2000;
import { sampleImageForNumber } from "./sampleImageCatalog.js";
const authors = ["Avery Chen", "Jordan Kim", "Morgan Patel", "Riley Okafor", "Sam Rivera"];
const topics = ["Product notes", "Design review", "Team update", "Research log", "Customer story"];

export const windowedLabPosts = Array.from({ length: POST_COUNT }, (_, index) => {
  const postNumber = index + 1;
  const images = [sampleImageForNumber(postNumber)];

  if (postNumber % 2 === 0) {
    images.push(sampleImageForNumber(postNumber + 997));
  }

  return {
    id: `windowed-lab-${postNumber}`,
    author: authors[index % authors.length],
    title: `${topics[index % topics.length]} #${postNumber}`,
    content: "A deterministic image-heavy post for measuring virtualized feed rendering and loading behavior.",
    commentCount: index % 24,
    createdAt: Date.now() - index * 60 * 1000,
    images
  };
});
