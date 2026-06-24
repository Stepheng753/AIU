import React from 'react';

export const parseUTCTimestamp = (ts: string): Date => {
  if (!ts) return new Date();
  let formatted = ts.trim();
  if (!formatted.includes('T')) {
    formatted = formatted.replace(' ', 'T');
  }
  const hasTimezone = formatted.endsWith('Z') ||
    (formatted.includes('T') && (formatted.indexOf('+', formatted.indexOf('T')) !== -1 || formatted.indexOf('-', formatted.indexOf('T')) !== -1));
  if (!hasTimezone) {
    formatted += 'Z';
  }
  const date = new Date(formatted);
  return isNaN(date.getTime()) ? new Date(ts) : date;
};

export const formatTranscriptText = (text: string): string => {
  if (!text) return '';

  // 1. Capitalize the first letter of the overall text and any letter following sentence-ending punctuation (. ? !)
  let formatted = text.replace(/(^\s*|[.!?]\s+)([a-z])/gi, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });

  // Ensure the very first non-whitespace character is capitalized
  formatted = formatted.trim();
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // 2. Wrap filler words in asterisks for italics formatting
  const fillerRegex = /\b(um|umm|uh|uhh|er|ah|err)\b/gi;
  formatted = formatted.replace(fillerRegex, (match) => {
    return `*${match}*`;
  });

  return formatted;
};

export const renderMessageText = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index} className="opacity-80 italic font-medium">{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
};

export const float32ToInt16 = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // little-endian
  }
  return buffer;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};
