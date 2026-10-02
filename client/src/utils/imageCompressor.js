/**
 * Client-Side Image Compression Utility
 * Resizes and compresses images directly in the browser via HTML5 Canvas
 * prior to uploading. Drastically reduces payload size (from 4-8MB down to ~150-250KB)
 * to save mobile data, prevent Render OOM crashes, and keep Cloudinary usage within free tier.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  // If not an image or already smaller than 120KB, return as-is
  if (!file || !file.type.startsWith('image/') || file.size < 120 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      console.warn('[ImageCompressor] FileReader failed, using original file');
      resolve(file);
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        console.warn('[ImageCompressor] Image decoding failed, using original file');
        resolve(file);
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('[ImageCompressor] Canvas 2D context unavailable, using original');
          return resolve(file);
        }

        // Draw image onto canvas with high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Create a new File object preserving the original file name
            const originalName = file.name || 'photo.jpg';
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const newFileName = `${baseName}.jpg`;

            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            console.log(
              `[ImageCompressor] Compressed ${file.name} from ${(file.size / 1024).toFixed(1)} KB to ${(compressedFile.size / 1024).toFixed(1)} KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
            );

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

export default compressImage;
