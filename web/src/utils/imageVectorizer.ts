/**
 * Image Vectorizer Utility
 * Converts raster images (JPEG/PNG/WebP) to SVG vector format
 * using canvas-based tracing for crisp, scalable master plan images.
 */

// ImageTracerJS options presets for different image types
interface VectorizerOptions {
  // Line tracing resolution (lower = more detail, slower)
  ltres?: number;
  // Quadratic spline tolerance (lower = smoother curves)
  qtres?: number;
  // Color quantization cycles
  colorquantcycles?: number;
  // Number of colors
  numberofcolors?: number;
  // Min color ratio (0-1)
  mincolorratio?: number;
  // Path omit threshold (min path length to keep)
  pathomit?: number;
  // Scale factor
  scale?: number;
  // Blur radius (0 = no blur)
  blurradius?: number;
  // Blur delta (color difference threshold for blur)
  blurdelta?: number;
}

// Preset for architectural/site plan diagrams (high detail)
export const PRESET_ARCHITECTURAL: VectorizerOptions = {
  ltres: 0.1,
  qtres: 1,
  colorquantcycles: 8,
  numberofcolors: 64,
  mincolorratio: 0,
  pathomit: 2,
  scale: 1,
  blurradius: 0,
  blurdelta: 20,
};

// Preset for photographic/render images (balanced)
export const PRESET_PHOTOGRAPHIC: VectorizerOptions = {
  ltres: 1,
  qtres: 0.01,
  colorquantcycles: 6,
  numberofcolors: 32,
  mincolorratio: 0,
  pathomit: 4,
  scale: 1,
  blurradius: 2,
  blurdelta: 40,
};

// Default preset
export const PRESET_DEFAULT: VectorizerOptions = {
  ltres: 0.1,
  qtres: 1,
  colorquantcycles: 8,
  numberofcolors: 128,
  mincolorratio: 0,
  pathomit: 2,
  scale: 1,
  blurradius: 0,
  blurdelta: 20,
};

/**
 * Load an image URL onto a canvas and get ImageData
 */
function loadImageToCanvas(
  imageUrl: string,
  maxSize: number = 2048
): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Scale down if too large (performance)
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve({ canvas, imageData });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Convert a raster image URL to an SVG string using ImageTracerJS.
 *
 * @param imageUrl - The URL of the raster image to vectorize
 * @param options - Tracing options (defaults to PRESET_DEFAULT)
 * @param preprocess - Optional image filter configurations
 * @param onProgress - Optional progress callback
 * @returns SVG string
 */
export async function vectorizeImage(
  imageUrl: string,
  options: VectorizerOptions = PRESET_DEFAULT,
  preprocess?: { grayscale?: boolean; threshold?: number; invert?: boolean },
  onProgress?: (stage: string) => void
): Promise<string> {
  onProgress?.('Loading image...');

  const { canvas, imageData } = await loadImageToCanvas(imageUrl);

  if (preprocess) {
    onProgress?.('Preprocessing image filters...');
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate grayscale value
      let val = 0.299 * r + 0.587 * g + 0.114 * b;
      
      if (preprocess.threshold !== undefined) {
        val = val >= preprocess.threshold ? 255 : 0;
      }
      
      if (preprocess.invert) {
        val = 255 - val;
      }
      
      if (preprocess.grayscale || preprocess.threshold !== undefined) {
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      } else if (preprocess.invert) {
        // If color but inverted
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      }
    }
  }

  onProgress?.('Tracing image to vector paths...');

  // Dynamically import ImageTracerJS
  const ImageTracer = await import('imagetracerjs');
  const tracer = ImageTracer.default || ImageTracer;

  // Convert ImageData to SVG string
  const svgString: string = tracer.imagedataToSVG(imageData, options);

  onProgress?.('Vector conversion complete!');

  return svgString;
}

/**
 * Convert SVG string to a Blob for uploading
 */
export function svgStringToBlob(svgString: string): Blob {
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Convert SVG string to a data URL for preview
 */
export function svgStringToDataUrl(svgString: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}

/**
 * Convert a raster image URL to SVG and return as a File object
 * ready for upload.
 */
export async function vectorizeImageToFile(
  imageUrl: string,
  fileName: string = 'master_plan.svg',
  options: VectorizerOptions = PRESET_DEFAULT,
  onProgress?: (stage: string) => void
): Promise<File> {
  const svgString = await vectorizeImage(imageUrl, options, undefined, onProgress);
  const blob = svgStringToBlob(svgString);
  return new File([blob], fileName, { type: 'image/svg+xml' });
}
