"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";

interface CodeSnippetProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export default function CodeSnippet({
  code,
  language = "typescript",
  showLineNumbers = true,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-zinc-900 text-zinc-100">
      {/* prevent form submission */}
      <div className="absolute right-2 top-2 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 bg-zinc-800/80 text-zinc-100 backdrop-blur-sm hover:bg-zinc-700"
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy code</span>
        </Button>
      </div>

      {copied && (
        <div className="absolute right-12 top-2 z-10 rounded bg-zinc-800/80 px-2 py-1 text-xs backdrop-blur-sm">
          Copied!
        </div>
      )}

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "0.9rem",
          background: "#1f1f1f", // slightly lighter gray
          color: "#D1D5DB", // softer grayish white
          fontFamily: "'Fira Code', monospace",
          lineHeight: "1.5",
          textRendering: "geometricPrecision",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
        lineNumberStyle={{
          color: "#6B7280", // medium gray for line numbers
          fontSize: "0.8rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Card>
  );
}
