"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeftCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      {/* Error Code */}
      <h1 className="text-5xl md:text-5xl font-extrabold tracking-tight text-primary gradient-title mb-4">
        404
      </h1>

      {/* Message */}
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 gradient-text text-center">
        Oops! Page not found.
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        The page you’re looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        <Link href="/" passHref>
          <Button size="lg" variant="default" className="gap-2">
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeftCircle className="h-5 w-5" />
          Go Back
        </Button>
      </div>

      {/* Optional Footer */}
      <p className="mt-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} SensAI. All rights reserved.
      </p>
    </div>
  );
}
