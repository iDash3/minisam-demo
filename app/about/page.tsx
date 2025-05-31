"use client"; // Required for MiniSamSegmenter and its hooks

import Header from "@/components/layout/header";
import { MiniSamSegmenter } from "@minisam/react"; // Removed MiniSamRef type import
import Image from "next/image"; // For the code snippet display

const sampleImageForDemo = {
  src: "/images/corgi-running.png",
  alt: "Running corgi dog in a field",
};

const minimalImplementationCode = `
import { MiniSamSegmenter } from "@minisam/react";

function MyAwesomeComponent() {
  return (
    <MiniSamSegmenter
      image="${sampleImageForDemo.src}"
      onMaskUpdate={(mask) => {
        if (mask) {
          console.log("Mask updated on About page:", mask);
        }
      }}
    />
  );
}
`;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header activePage="about" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          About @minisam/react & Simple Demo
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          <code>@minisam/react</code> provides ready-to-use React components for
          integrating the miniSAM (Segment Anything Model) directly into your
          web applications. It handles model initialization, image loading,
          click handling, mask generation, and UI rendering with minimal setup.
        </p>
        <p className="text-lg text-gray-700 mb-8">
          Below is a live, minimal example of the <code>MiniSamSegmenter</code>{" "}
          component in action. Click on the image to segment the corgi!
        </p>

        {/* Live Demo Section */}
        <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Live Demo
          </h2>
          <div className="max-w-md mx-auto">
            <MiniSamSegmenter
              image={sampleImageForDemo.src}
              onMaskUpdate={(mask) => {
                if (mask) {
                  console.log("Mask updated on About page (live demo):", mask);
                }
              }}
              // Adding a few basic props for a slightly better visual
              maskOpacity={0.6}
              maskColor="#8b5cf6" // A nice violet
              showClickMarkers={true}
              clickMarkerSize={15}
            />
          </div>
        </div>

        {/* Code Snippet Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Easy Implementation (Copy & Paste)
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Implementing the segmenter is as simple as this:
          </p>
          <pre className="bg-gray-800 text-white p-6 rounded-lg overflow-x-auto">
            <code>{minimalImplementationCode}</code>
          </pre>
        </div>
      </main>
    </div>
  );
}
