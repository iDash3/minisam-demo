import React from 'react';
import { ClickType } from 'minisam';
export { ClickType } from 'minisam';

interface Click$1 {
    x: number;
    y: number;
    type: ClickType;
}
interface MiniSamRef {
    reset: () => void;
    undo: () => void;
    extractMask: () => ImageData | null;
    getClicks: () => Click$1[];
    getMask: () => ImageData | null;
    getImage: () => HTMLImageElement | null;
    setClickMode: (mode: ClickType) => void;
    segmentWithClicks: (clicks: Click$1[]) => Promise<void>;
}
interface MiniSamSegmenterProps {
    image?: string | File | HTMLImageElement;
    autoInit?: boolean;
    clickMode?: ClickType;
    onMaskUpdate?: (mask: ImageData | null) => void;
    onClicksUpdate?: (clicks: Click$1[]) => void;
    onImageLoad?: (image: HTMLImageElement) => void;
    onInitialized?: () => void;
    onError?: (error: Error) => void;
    className?: string;
    imageClassName?: string;
    maskClassName?: string;
    clickMarkerClassName?: string;
    showClickMarkers?: boolean;
    clickMarkerSize?: number;
    maskOpacity?: number;
    maskColor?: string;
    includeClickColor?: string;
    excludeClickColor?: string;
    children?: React.ReactNode | ((props: {
        isLoading: boolean;
        isInitialized: boolean;
        clicks: Click$1[];
        hasImage: boolean;
        hasMask: boolean;
        clickMode: ClickType;
        reset: () => void;
        undo: () => void;
        setClickMode: (mode: ClickType) => void;
        extractMask: () => ImageData | null;
    }) => React.ReactNode);
}
declare const MiniSamSegmenter: React.ForwardRefExoticComponent<MiniSamSegmenterProps & React.RefAttributes<MiniSamRef>>;

interface Click {
    x: number;
    y: number;
    type: ClickType;
}
interface UseMiniSamOptions {
    autoInit?: boolean;
    onInitialized?: () => void;
    onError?: (error: Error) => void;
}
interface UseMiniSamReturn {
    isInitialized: boolean;
    isLoading: boolean;
    image: HTMLImageElement | null;
    clicks: Click[];
    mask: ImageData | null;
    initialize: () => Promise<void>;
    loadImage: (source: string | File | HTMLImageElement) => Promise<void>;
    addClick: (x: number, y: number, type?: ClickType) => Promise<ImageData | null>;
    removeLastClick: () => Promise<ImageData | null | undefined>;
    reset: () => void;
    segment: () => Promise<ImageData | null>;
    segmentWithClicks: (clicks: Click[]) => Promise<ImageData | null>;
    extractMaskAsCanvas: () => HTMLCanvasElement | null;
    extractMaskAsBlob: (type?: string, quality?: number) => Promise<Blob | null>;
}
declare function useMiniSam(options?: UseMiniSamOptions): UseMiniSamReturn;

/**
 * Convert a mask ImageData to a canvas element
 */
declare function maskToCanvas(mask: ImageData): HTMLCanvasElement;
/**
 * Apply a mask to an image and return the masked result
 */
declare function applyMaskToImage(image: HTMLImageElement | HTMLCanvasElement, mask: ImageData, options?: {
    trimToContent?: boolean;
    padding?: number;
}): HTMLCanvasElement;
/**
 * Trim a canvas to its content bounds
 */
declare function trimCanvasToContent(canvas: HTMLCanvasElement, padding?: number): HTMLCanvasElement;
/**
 * Convert a canvas to a blob
 */
declare function canvasToBlob(canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob | null>;
/**
 * Download a canvas as an image file
 */
declare function downloadCanvas(canvas: HTMLCanvasElement, filename?: string, type?: string, quality?: number): void;
/**
 * Calculate mask bounds (bounding box of non-transparent pixels)
 */
declare function getMaskBounds(mask: ImageData): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
} | null;

export { type Click$1 as Click, type MiniSamRef, MiniSamSegmenter, type MiniSamSegmenterProps, type UseMiniSamOptions, type UseMiniSamReturn, applyMaskToImage, canvasToBlob, downloadCanvas, getMaskBounds, maskToCanvas, trimCanvasToContent, useMiniSam };
