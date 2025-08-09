export default function randomNumber(start, end) {
  if (end === undefined) {
    return Math.floor(Math.random() * start) + 1
  }
  return Math.floor(Math.random() * (end - start + 1)) + start
}
