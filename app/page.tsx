"use client";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/header";

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
];

export default function HomePage() {
  const handleImageClick = (imageId: number) => {
    window.location.href = `/demo?image=${imageId}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header activePage="home" />

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-base text-gray-600">
            ↓ Find a photo in the gallery, or{" "}
            <Link
              href="/demo"
              className="text-blue-600 underline hover:text-blue-700"
            >
              Upload an image
            </Link>
          </p>
        </div>

        {/* Image Gallery */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-4 space-y-4">
          {sampleImages.map((image) => (
            <div
              key={image.id}
              className="cursor-pointer group block break-inside-avoid overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out"
              onClick={() => handleImageClick(image.id)}
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                width={400}
                height={300}
                className="w-full h-auto object-cover block group-hover:opacity-90 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
