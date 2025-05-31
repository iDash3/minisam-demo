"use client"
import Link from "next/link"
import Image from "next/image"
import { Github } from "lucide-react"

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

export default function HomePage() {
  const handleImageClick = (imageId: number) => {
    window.location.href = `/demo?image=${imageId}`
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-lg text-gray-700">
            ↓ Find a photo in the gallery, or{" "}
            <Link href="/demo" className="text-blue-600 underline hover:text-blue-800">
              Upload an image
            </Link>
          </p>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleImages.map((image) => (
            <div
              key={image.id}
              className="cursor-pointer group overflow-hidden transition-shadow"
              onClick={() => handleImageClick(image.id)}
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                width={400}
                height={300}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
