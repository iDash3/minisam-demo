"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, GalleryThumbnailsIcon as Gallery, MousePointer, Plus, Minus, RotateCcw, Sparkles } from "lucide-react"
import { Github } from "lucide-react"
import { MiniSamSegmenter, type MiniSamRef } from "@minisam/react"

const sampleImages = [
  {
    id: 1,
    src: "/images/corgi-running.png",
    alt: "Running corgi dog in a field",
  },
  {
    id: 2,
    src: "/images/farmhouse-provence.jpg",
    alt: "Farmhouse in Provence painting",
  },
  {
    id: 3,
    src: "/images/bear-family.png",
    alt: "Bear family by the water",
  },
  {
    id: 4,
    src: "/images/frog-turtle-snail.png",
    alt: "Frog on turtle with snail",
  },
  {
    id: 5,
    src: "/images/nyc-skyline.png",
    alt: "New York City skyline with Brooklyn Bridge",
  },
  {
    id: 6,
    src: "/images/dogs-stick.png",
    alt: "Two dogs sharing a stick on beach",
  },
]

export default function DemoPage() {
  const searchParams = useSearchParams()
  const imageId = searchParams.get("image")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const segmenterRef = useRef<MiniSamRef>(null)

  const [currentImage, setCurrentImage] = useState(() => {
    if (imageId) {
      const id = Number.parseInt(imageId)
      return sampleImages.find((img) => img.id === id) || sampleImages[0]
    }
    return sampleImages[0]
  })

  const [tool, setTool] = useState<"add" | "remove">("add")
  const [selectedMode, setSelectedMode] = useState<"hover-click" | "everything">("hover-click")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCurrentImage({
        id: 0,
        src: URL.createObjectURL(file),
        alt: "Uploaded image",
      })
    }
  }

  const handleReset = () => {
    segmenterRef.current?.reset()
  }

  const handleUndo = () => {
    segmenterRef.current?.undo()
  }

  const handleEverythingMode = async () => {
    if (segmenterRef.current) {
      setIsProcessing(true)
      try {
        // For "Everything" mode, we'll add a click in the center to trigger segmentation
        const image = segmenterRef.current.getImage()
        if (image) {
          const centerX = image.width / 2
          const centerY = image.height / 2
          await segmenterRef.current.segmentWithClicks([{ x: centerX, y: centerY, type: "include" }])
        }
      } catch (error) {
        console.error("Error in everything mode:", error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleCutOutAllObjects = async () => {
    const mask = segmenterRef.current?.extractMask()
    if (mask) {
      // Create a download link for the mask
      const canvas = document.createElement("canvas")
      canvas.width = mask.width
      canvas.height = mask.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.putImageData(mask, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "segmented-objects.png"
            a.click()
            URL.revokeObjectURL(url)
          }
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">miniSAM</h1>
              <p className="text-sm text-gray-600">ONNX SAM segmentation directly in the browser</p>
            </Link>
          </div>
          <nav className="flex items-center space-x-8">
            <Link href="/" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
              Demo
            </Link>
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <a
              href="https://github.com/iDash3/minisam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900"
            >
              <Github className="w-6 h-6" />
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex max-w-7xl mx-auto">
        {/* Tools Panel */}
        <div className="w-80 p-6 border-r border-gray-200">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Tools</h2>

            {/* Upload and Gallery */}
            <div className="flex gap-2 mb-6">
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Gallery className="w-4 h-4" />
                  Gallery
                </Button>
              </Link>
            </div>

            {/* Hover & Click Section */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer mb-4 ${
                selectedMode === "hover-click" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
              }`}
              onClick={() => setSelectedMode("hover-click")}
            >
              <div className="flex items-center gap-2 mb-3">
                <MousePointer
                  className={`w-5 h-5 ${selectedMode === "hover-click" ? "text-blue-600" : "text-gray-700"}`}
                />
                <h3 className={`font-semibold ${selectedMode === "hover-click" ? "text-blue-900" : "text-gray-900"}`}>
                  Hover & Click
                </h3>
              </div>

              {selectedMode === "hover-click" && (
                <>
                  <p className="text-sm text-blue-700 mb-4">
                    Click an object one or more times. Shift-click to remove regions.
                  </p>

                  {/* Add/Remove Tools */}
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <Button
                        variant={tool === "add" ? "default" : "outline"}
                        size="sm"
                        className={`w-12 h-12 rounded-lg p-0 ${
                          tool === "add"
                            ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setTool("add")
                          segmenterRef.current?.setClickMode("include")
                        }}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                      <span
                        className={`text-sm mt-2 ${tool === "add" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                      >
                        Add Mask
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Button
                        variant={tool === "remove" ? "default" : "outline"}
                        size="sm"
                        className={`w-12 h-12 rounded-lg p-0 ${
                          tool === "remove"
                            ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setTool("remove")
                          segmenterRef.current?.setClickMode("exclude")
                        }}
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      <span
                        className={`text-sm mt-2 ${tool === "remove" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                      >
                        Remove Area
                      </span>
                    </div>
                  </div>

                  {/* Reset and Undo Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 flex items-center gap-2" onClick={handleUndo}>
                      Undo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-2"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Everything Section */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer ${
                selectedMode === "everything" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
              }`}
              onClick={() => {
                setSelectedMode("everything")
                if (selectedMode !== "everything") {
                  handleEverythingMode()
                }
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-5 h-5 ${selectedMode === "everything" ? "text-blue-600" : "text-gray-700"}`} />
                <h3 className={`font-semibold ${selectedMode === "everything" ? "text-blue-600" : "text-gray-900"}`}>
                  Everything
                </h3>
              </div>

              {selectedMode === "everything" && (
                <>
                  <p className="text-sm text-blue-700 mb-4">Find all the objects in the image automatically.</p>

                  {/* Cut out all objects button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300"
                    onClick={handleCutOutAllObjects}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Cut out all objects"}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 p-6">
          <div className="relative inline-block">
            {selectedMode === "hover-click" ? (
              <MiniSamSegmenter
                ref={segmenterRef}
                image={currentImage.src}
                clickMode={tool === "add" ? "include" : "exclude"}
                maskOpacity={0.5}
                maskColor="#6366f1"
                includeClickColor="#10b981"
                excludeClickColor="#ef4444"
                showClickMarkers={true}
                clickMarkerSize={12}
                className="max-w-full h-auto"
                imageClassName="max-w-full h-auto cursor-crosshair"
                onInitialized={() => console.log("miniSAM initialized!")}
                onError={(error) => console.error("miniSAM error:", error)}
                onMaskUpdate={(mask) => {
                  if (mask) {
                    console.log("Mask updated:", mask)
                  }
                }}
              />
            ) : (
              <div className="relative">
                <Image
                  src={currentImage.src || "/placeholder.svg"}
                  alt={currentImage.alt}
                  width={800}
                  height={600}
                  className="max-w-full h-auto"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-lg">Processing...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  )
}
