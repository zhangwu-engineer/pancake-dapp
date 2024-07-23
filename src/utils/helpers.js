export const generateRandomIndices = (max, count) => {
  const maxNumber = Number(max)
  const indices = new Set();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * maxNumber));
  }
  return Array.from(indices);
};
