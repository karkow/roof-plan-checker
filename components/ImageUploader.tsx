"use client";

import { useState, useId } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  label: string;
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({ label, onImageSelect }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      setFileName(file.name);

      // Check if it's a PDF
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setIsPdf(true);
        setPreview(null);
      } else {
        setIsPdf(false);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
      <label htmlFor={inputId} className="block cursor-pointer">
        <span className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          aria-describedby={`${inputId}-description`}
        />
        {preview ? (
          <div className="relative w-full h-64">
            <Image
              src={preview}
              alt={`Vorschau: ${label}`}
              fill
              className="object-contain"
            />
          </div>
        ) : isPdf ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 bg-gray-50 rounded">
            <svg
              className="w-16 h-16 mb-3 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1.2l.9 2.2.9-2.2h1.2L11.3 16l1.4 3h-1.2l-.9-2.2-.9 2.2H8.5l1.4-3-1.4-3zm4.5 0h1v4.5h2V19h-3v-6z"/>
            </svg>
            <span className="font-medium">PDF geladen</span>
            <span className="text-sm text-gray-500 mt-1 max-w-full truncate px-4">{fileName}</span>
            <span id={`${inputId}-description`} className="text-xs text-gray-400 mt-2">
              Wird beim Vergleich konvertiert
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Klicken zum Hochladen</span>
            <span id={`${inputId}-description`} className="text-xs mt-1">Bilder oder PDF</span>
          </div>
        )}
      </label>
    </div>
  );
}
