export async function compressImage(file: File, targetKB = 90): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // PDFs etc pass through untouched

  const bitmap = await createImageBitmap(file);
  const maxDim = 1280;
  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.8;
  let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));

  // Step quality down until under target size or quality floor hit.
  while (blob && blob.size / 1024 > targetKB && quality > 0.2) {
    quality -= 0.1;
    blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  }

  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}
