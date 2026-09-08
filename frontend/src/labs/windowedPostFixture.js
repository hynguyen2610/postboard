const POST_COUNT = 2000;
const IMAGE_COUNT = 2000;
const authors = ["Avery Chen", "Jordan Kim", "Morgan Patel", "Riley Okafor", "Sam Rivera"];
const topics = ["Product notes", "Design review", "Team update", "Research log", "Customer story"];

function imagePath(imageNumber) {
  return `/docs/image-${imageNumber}.jpg`;
}

function imageNumberFor(postNumber, offset = 0) {
  return ((postNumber - 1 + offset) % IMAGE_COUNT) + 1;
}

export const windowedLabPosts = Array.from({ length: POST_COUNT }, (_, index) => {
  const postNumber = index + 1;
  const images = [imagePath(imageNumberFor(postNumber))];

  if (postNumber % 2 === 0) {
    images.push(imagePath(imageNumberFor(postNumber, 997)));
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
