// src/components/MiniSamSegmenter.tsx
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import {
  initSegmentation,
  createSession,
  precomputeEmbedding
} from "minisam";
import clsx from "clsx";
import { jsx, jsxs } from "react/jsx-runtime";
var MiniSamSegmenter = forwardRef(
  ({
    image,
    autoInit = true,
    clickMode: initialClickMode = "include",
    onMaskUpdate,
    onClicksUpdate,
    onImageLoad,
    onInitialized,
    onError,
    className,
    imageClassName,
    maskClassName,
    clickMarkerClassName,
    showClickMarkers = true,
    clickMarkerSize = 20,
    maskOpacity = 0.5,
    maskColor = "#6366f1",
    includeClickColor = "#10b981",
    excludeClickColor = "#ef4444",
    children
  }, ref) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedImage, setLoadedImage] = useState(
      null
    );
    const [clicks, setClicks] = useState([]);
    const [clickMode, setClickMode] = useState(initialClickMode);
    const [mask, setMask] = useState(null);
    const [session, setSession] = useState(null);
    const containerRef = useRef(null);
    const imageCanvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
    const imageElementRef = useRef(null);
    useEffect(() => {
      if (!autoInit) return;
      const init = async () => {
        try {
          setIsLoading(true);
          await initSegmentation();
          setIsInitialized(true);
          onInitialized?.();
        } catch (error) {
          console.error("Failed to initialize miniSAM:", error);
          onError?.(error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }, [autoInit, onInitialized, onError]);
    useEffect(() => {
      if (!image || !isInitialized) return;
      const loadImage = async () => {
        try {
          setIsLoading(true);
          let img;
          if (image instanceof HTMLImageElement) {
            img = image;
          } else if (typeof image === "string") {
            img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = image;
            });
          } else if (image instanceof File) {
            img = new Image();
            const url = URL.createObjectURL(image);
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });
            URL.revokeObjectURL(url);
          } else {
            throw new Error("Invalid image type");
          }
          imageElementRef.current = img;
          setLoadedImage(img);
          setClicks([]);
          setMask(null);
          const canvas = imageCanvasRef.current;
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
          }
          await precomputeEmbedding(img);
          const newSession = createSession(img);
          setSession(newSession);
          onImageLoad?.(img);
        } catch (error) {
          console.error("Error loading image:", error);
          onError?.(error);
        } finally {
          setIsLoading(false);
        }
      };
      loadImage();
    }, [image, isInitialized, onImageLoad, onError]);
    const handleCanvasClick = useCallback(
      async (e) => {
        if (!loadedImage || !session || isLoading) return;
        const canvas = imageCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = loadedImage.width / rect.width;
        const scaleY = loadedImage.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const newClick = { x, y, type: clickMode };
        const newClicks = [...clicks, newClick];
        setClicks(newClicks);
        onClicksUpdate?.(newClicks);
        session.addClick(x, y, clickMode);
        setIsLoading(true);
        try {
          const maskData = await session.segment(loadedImage);
          setMask(maskData);
          onMaskUpdate?.(maskData);
          const maskCanvas = maskCanvasRef.current;
          if (maskCanvas && maskData) {
            maskCanvas.width = maskData.width;
            maskCanvas.height = maskData.height;
            const ctx = maskCanvas.getContext("2d");
            if (ctx) {
              const imageData = ctx.createImageData(
                maskData.width,
                maskData.height
              );
              const color = hexToRgb(maskColor);
              for (let i = 0; i < maskData.data.length; i += 4) {
                const alpha = maskData.data[i + 3];
                if (alpha > 0) {
                  imageData.data[i] = color.r;
                  imageData.data[i + 1] = color.g;
                  imageData.data[i + 2] = color.b;
                  imageData.data[i + 3] = alpha;
                }
              }
              ctx.putImageData(imageData, 0, 0);
            }
          }
        } catch (error) {
          console.error("Segmentation error:", error);
          onError?.(error);
        } finally {
          setIsLoading(false);
        }
      },
      [
        loadedImage,
        session,
        isLoading,
        clickMode,
        clicks,
        maskColor,
        onClicksUpdate,
        onMaskUpdate,
        onError
      ]
    );
    const reset = useCallback(() => {
      if (session) {
        session.reset();
      }
      setClicks([]);
      setMask(null);
      onClicksUpdate?.([]);
      onMaskUpdate?.(null);
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const ctx = maskCanvas.getContext("2d");
        ctx?.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }, [session, onClicksUpdate, onMaskUpdate]);
    const undo = useCallback(async () => {
      if (!session || !loadedImage || clicks.length === 0) return;
      session.removeLastClick();
      const newClicks = clicks.slice(0, -1);
      setClicks(newClicks);
      onClicksUpdate?.(newClicks);
      if (newClicks.length > 0) {
        setIsLoading(true);
        try {
          const maskData = await session.segment(loadedImage);
          setMask(maskData);
          onMaskUpdate?.(maskData);
          const maskCanvas = maskCanvasRef.current;
          if (maskCanvas && maskData) {
            const ctx = maskCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
              const imageData = ctx.createImageData(
                maskData.width,
                maskData.height
              );
              const color = hexToRgb(maskColor);
              for (let i = 0; i < maskData.data.length; i += 4) {
                const alpha = maskData.data[i + 3];
                if (alpha > 0) {
                  imageData.data[i] = color.r;
                  imageData.data[i + 1] = color.g;
                  imageData.data[i + 2] = color.b;
                  imageData.data[i + 3] = alpha;
                }
              }
              ctx.putImageData(imageData, 0, 0);
            }
          }
        } catch (error) {
          console.error("Segmentation error:", error);
          onError?.(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        reset();
      }
    }, [
      session,
      loadedImage,
      clicks,
      maskColor,
      reset,
      onClicksUpdate,
      onMaskUpdate,
      onError
    ]);
    const segmentWithClicks = useCallback(
      async (newClicks) => {
        if (!session || !loadedImage) return;
        session.reset();
        newClicks.forEach((click) => {
          session.addClick(click.x, click.y, click.type);
        });
        setClicks(newClicks);
        onClicksUpdate?.(newClicks);
        if (newClicks.length === 0) {
          reset();
          return;
        }
        setIsLoading(true);
        try {
          const maskData = await session.segment(loadedImage);
          setMask(maskData);
          onMaskUpdate?.(maskData);
          const maskCanvas = maskCanvasRef.current;
          if (maskCanvas && maskData) {
            const ctx = maskCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
              const imageData = ctx.createImageData(
                maskData.width,
                maskData.height
              );
              const color = hexToRgb(maskColor);
              for (let i = 0; i < maskData.data.length; i += 4) {
                const alpha = maskData.data[i + 3];
                if (alpha > 0) {
                  imageData.data[i] = color.r;
                  imageData.data[i + 1] = color.g;
                  imageData.data[i + 2] = color.b;
                  imageData.data[i + 3] = alpha;
                }
              }
              ctx.putImageData(imageData, 0, 0);
            }
          }
        } catch (error) {
          console.error("Segmentation error:", error);
          onError?.(error);
        } finally {
          setIsLoading(false);
        }
      },
      [
        session,
        loadedImage,
        maskColor,
        reset,
        onClicksUpdate,
        onMaskUpdate,
        onError
      ]
    );
    useImperativeHandle(
      ref,
      () => ({
        reset,
        undo,
        extractMask: () => mask,
        getClicks: () => clicks,
        getMask: () => mask,
        getImage: () => loadedImage,
        setClickMode,
        segmentWithClicks
      }),
      [reset, undo, mask, clicks, loadedImage, segmentWithClicks]
    );
    const renderProps = {
      isLoading,
      isInitialized,
      clicks,
      hasImage: !!loadedImage,
      hasMask: !!mask,
      clickMode,
      reset,
      undo,
      setClickMode,
      extractMask: () => mask
    };
    return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: clsx("minisam-container", className), children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "minisam-canvas-wrapper",
          style: { position: "relative", display: "inline-block" },
          children: [
            /* @__PURE__ */ jsx(
              "canvas",
              {
                ref: imageCanvasRef,
                onClick: handleCanvasClick,
                className: clsx("minisam-image-canvas", imageClassName, {
                  "cursor-crosshair": loadedImage && !isLoading,
                  "cursor-wait": isLoading
                }),
                style: { display: "block", maxWidth: "100%", height: "auto" }
              }
            ),
            /* @__PURE__ */ jsx(
              "canvas",
              {
                ref: maskCanvasRef,
                className: clsx("minisam-mask-canvas", maskClassName),
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  opacity: maskOpacity,
                  display: mask ? "block" : "none",
                  maxWidth: "100%",
                  height: "auto"
                }
              }
            ),
            showClickMarkers && loadedImage && clicks.map((click, index) => {
              const canvas = imageCanvasRef.current;
              if (!canvas) return null;
              const rect = canvas.getBoundingClientRect();
              const scaleX = rect.width / loadedImage.width;
              const scaleY = rect.height / loadedImage.height;
              const left = click.x * scaleX;
              const top = click.y * scaleY;
              return /* @__PURE__ */ jsx(
                "div",
                {
                  className: clsx("minisam-click-marker", clickMarkerClassName),
                  style: {
                    position: "absolute",
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${clickMarkerSize}px`,
                    height: `${clickMarkerSize}px`,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: click.type === "include" ? includeClickColor : excludeClickColor,
                    backgroundColor: click.type === "include" ? `${includeClickColor}33` : `${excludeClickColor}33`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none"
                  }
                },
                index
              );
            })
          ]
        }
      ),
      typeof children === "function" ? children(renderProps) : children
    ] });
  }
);
MiniSamSegmenter.displayName = "MiniSamSegmenter";
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 };
}

// src/hooks/useMiniSam.ts
import { useState as useState2, useEffect as useEffect2, useCallback as useCallback2, useRef as useRef2 } from "react";
import {
  initSegmentation as initSegmentation2,
  createSession as createSession2,
  precomputeEmbedding as precomputeEmbedding2
} from "minisam";
function useMiniSam(options = {}) {
  const { autoInit = true, onInitialized, onError } = options;
  const [isInitialized, setIsInitialized] = useState2(false);
  const [isLoading, setIsLoading] = useState2(false);
  const [image, setImage] = useState2(null);
  const [clicks, setClicks] = useState2([]);
  const [mask, setMask] = useState2(null);
  const sessionRef = useRef2(null);
  const initPromiseRef = useRef2(null);
  const initialize = useCallback2(async () => {
    if (isInitialized) return;
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }
    initPromiseRef.current = (async () => {
      try {
        setIsLoading(true);
        await initSegmentation2();
        setIsInitialized(true);
        onInitialized?.();
      } catch (error) {
        console.error("Failed to initialize miniSAM:", error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
        initPromiseRef.current = null;
      }
    })();
    return initPromiseRef.current;
  }, [isInitialized, onInitialized, onError]);
  useEffect2(() => {
    if (autoInit) {
      initialize();
    }
  }, [autoInit, initialize]);
  const loadImage = useCallback2(
    async (source) => {
      if (!isInitialized) {
        await initialize();
      }
      setIsLoading(true);
      try {
        let img;
        if (source instanceof HTMLImageElement) {
          img = source;
        } else if (typeof source === "string") {
          img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = source;
          });
        } else if (source instanceof File) {
          img = new Image();
          const url = URL.createObjectURL(source);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          URL.revokeObjectURL(url);
        } else {
          throw new Error("Invalid image source");
        }
        setImage(img);
        setClicks([]);
        setMask(null);
        await precomputeEmbedding2(img);
        sessionRef.current = createSession2(img);
      } catch (error) {
        console.error("Error loading image:", error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, initialize, onError]
  );
  const addClick = useCallback2(
    async (x, y, type = "include") => {
      if (!image || !sessionRef.current) {
        throw new Error("No image loaded");
      }
      const newClick = { x, y, type };
      setClicks((prev) => [...prev, newClick]);
      sessionRef.current.addClick(x, y, type);
      setIsLoading(true);
      try {
        const maskData = await sessionRef.current.segment(image);
        setMask(maskData);
        return maskData;
      } catch (error) {
        console.error("Segmentation error:", error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [image, onError]
  );
  const removeLastClick = useCallback2(async () => {
    if (!image || !sessionRef.current || clicks.length === 0) return;
    sessionRef.current.removeLastClick();
    setClicks((prev) => prev.slice(0, -1));
    if (clicks.length > 1) {
      setIsLoading(true);
      try {
        const maskData = await sessionRef.current.segment(image);
        setMask(maskData);
        return maskData;
      } catch (error) {
        console.error("Segmentation error:", error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      setMask(null);
    }
  }, [image, clicks, onError]);
  const reset = useCallback2(() => {
    if (sessionRef.current) {
      sessionRef.current.reset();
    }
    setClicks([]);
    setMask(null);
  }, []);
  const segment = useCallback2(async () => {
    if (!image || !sessionRef.current || clicks.length === 0) {
      return null;
    }
    setIsLoading(true);
    try {
      const maskData = await sessionRef.current.segment(image);
      setMask(maskData);
      return maskData;
    } catch (error) {
      console.error("Segmentation error:", error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [image, clicks, onError]);
  const segmentWithClicks = useCallback2(
    async (newClicks) => {
      if (!image || !sessionRef.current) {
        throw new Error("No image loaded");
      }
      sessionRef.current.reset();
      newClicks.forEach((click) => {
        sessionRef.current.addClick(click.x, click.y, click.type);
      });
      setClicks(newClicks);
      if (newClicks.length === 0) {
        setMask(null);
        return null;
      }
      setIsLoading(true);
      try {
        const maskData = await sessionRef.current.segment(image);
        setMask(maskData);
        return maskData;
      } catch (error) {
        console.error("Segmentation error:", error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [image, onError]
  );
  const extractMaskAsCanvas = useCallback2(() => {
    if (!mask || !image) return null;
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const scaleX = mask.width / image.width;
    const scaleY = mask.height / image.height;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const imageIdx = (y * image.width + x) * 4;
        const maskX = Math.floor(x * scaleX);
        const maskY = Math.floor(y * scaleY);
        const maskIdx = (maskY * mask.width + maskX) * 4;
        if (mask.data[maskIdx + 3] === 0) {
          imageData.data[imageIdx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, [mask, image]);
  const extractMaskAsBlob = useCallback2(
    async (type = "image/png", quality) => {
      const canvas = extractMaskAsCanvas();
      if (!canvas) return null;
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
      });
    },
    [extractMaskAsCanvas]
  );
  useEffect2(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.dispose();
      }
    };
  }, []);
  return {
    // State
    isInitialized,
    isLoading,
    image,
    clicks,
    mask,
    // Actions
    initialize,
    loadImage,
    addClick,
    removeLastClick,
    reset,
    segment,
    segmentWithClicks,
    extractMaskAsCanvas,
    extractMaskAsBlob
  };
}

// src/utils/mask-utils.ts
function maskToCanvas(mask) {
  const canvas = document.createElement("canvas");
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.putImageData(mask, 0, 0);
  }
  return canvas;
}
function applyMaskToImage(image, mask, options = {}) {
  const { trimToContent = false, padding = 0 } = options;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const scaleX = mask.width / image.width;
  const scaleY = mask.height / image.height;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const imageIdx = (y * image.width + x) * 4;
      const maskX = Math.floor(x * scaleX);
      const maskY = Math.floor(y * scaleY);
      const maskIdx = (maskY * mask.width + maskX) * 4;
      if (mask.data[maskIdx + 3] === 0) {
        imageData.data[imageIdx + 3] = 0;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  if (trimToContent) {
    return trimCanvasToContent(canvas, padding);
  }
  return canvas;
}
function trimCanvasToContent(canvas, padding = 0) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const l = pixels.data.length;
  const bound = {
    top: null,
    left: null,
    right: null,
    bottom: null
  };
  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      const x = i / 4 % canvas.width;
      const y = ~~(i / 4 / canvas.width);
      if (bound.top === null) {
        bound.top = y;
      }
      if (bound.left === null) {
        bound.left = x;
      } else if (x < bound.left) {
        bound.left = x;
      }
      if (bound.right === null) {
        bound.right = x;
      } else if (bound.right < x) {
        bound.right = x;
      }
      if (bound.bottom === null) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }
  if (bound.top === null || bound.left === null || bound.right === null || bound.bottom === null) {
    return canvas;
  }
  bound.top = Math.max(0, bound.top - padding);
  bound.left = Math.max(0, bound.left - padding);
  bound.right = Math.min(canvas.width - 1, bound.right + padding);
  bound.bottom = Math.min(canvas.height - 1, bound.bottom + padding);
  const trimWidth = bound.right - bound.left + 1;
  const trimHeight = bound.bottom - bound.top + 1;
  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  const trimmedCtx = trimmedCanvas.getContext("2d");
  if (trimmedCtx) {
    trimmedCtx.drawImage(
      canvas,
      bound.left,
      bound.top,
      trimWidth,
      trimHeight,
      0,
      0,
      trimWidth,
      trimHeight
    );
  }
  return trimmedCanvas;
}
async function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
function downloadCanvas(canvas, filename = "segmented-image.png", type = "image/png", quality) {
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    type,
    quality
  );
}
function getMaskBounds(mask) {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const idx = (y * mask.width + x) * 4;
      if (mask.data[idx + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX === -1) {
    return null;
  }
  return {
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}
export {
  MiniSamSegmenter,
  applyMaskToImage,
  canvasToBlob,
  downloadCanvas,
  getMaskBounds,
  maskToCanvas,
  trimCanvasToContent,
  useMiniSam
};
