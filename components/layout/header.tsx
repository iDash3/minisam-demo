import Link from "next/link";
import { Github } from "lucide-react";

type HeaderProps = {
  activePage: "home" | "demo" | "about"; // Added "about"
};

export default function Header({ activePage }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">
              @minisam/react
            </h1>
            <p className="text-sm text-gray-600">
              ONNX SAM segmentation directly in the browser
            </p>
          </Link>
        </div>
        <nav className="flex items-center space-x-8">
          {/* For app/page.tsx, "Demo" is the primary link that looks like a main page link */}
          {/* For app/demo/page.tsx, "Demo" is also the active link */}
          <Link
            href="/demo" // Assuming the "Demo" link always goes to /demo
            className={`pb-1 ${
              activePage === "demo"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Demo
          </Link>
          <Link
            href="/about" // Assuming an /about page or adjust as needed
            className={`pb-1 ${
              activePage === "about" // Changed condition to "about"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            About
          </Link>
          <a
            href="https://github.com/iDash3/minisam-react"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-gray-900"
          >
            <Github className="w-6 h-6" />
          </a>
        </nav>
      </div>
    </header>
  );
}
