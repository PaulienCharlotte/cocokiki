export interface WorldView { scale: number; x: number; y: number }
export function worldMinimumScale(width: number, height: number, imageWidth: number, imageHeight: number): number {
  return Math.min(1, width / imageWidth, height / imageHeight);
}
export function worldImageSize(viewportWidth: number, viewportHeight: number, ratio: number) {
  const width = Math.max(viewportWidth, viewportHeight * ratio);
  return { width, height: width / ratio };
}
export function clampWorldView(view: WorldView, width: number, height: number, imageWidth: number, imageHeight: number): WorldView {
  const scale = Math.min(2.5, Math.max(worldMinimumScale(width, height, imageWidth, imageHeight), view.scale));
  const maxX = Math.max(0, (imageWidth * scale - width) / 2);
  const maxY = Math.max(0, (imageHeight * scale - height) / 2);
  return { scale, x: maxX ? Math.max(-maxX, Math.min(maxX, view.x)) : 0, y: maxY ? Math.max(-maxY, Math.min(maxY, view.y)) : 0 };
}
