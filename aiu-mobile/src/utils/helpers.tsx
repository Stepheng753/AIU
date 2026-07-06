import React from 'react';
import { Text } from 'react-native';

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

  // 1. Capitalize first letter of sentences
  let formatted = text.replace(/(^\s*|[.!?]\s+)([a-z])/gi, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });

  formatted = formatted.trim();
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // 2. Highlight filler words in italics (e.g. *um*)
  const fillerRegex = /\b(um|umm|uh|uhh|er|ah|err)\b/gi;
  formatted = formatted.replace(fillerRegex, (match) => {
    return `*${match}*`;
  });

  return formatted;
};

export const renderMessageText = (text: string, style?: any): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text key={index} style={{ fontStyle: 'italic', opacity: 0.8, fontWeight: '500' }}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
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

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let base64 = '';
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = i + 1 < len ? ((b2 & 15) << 2) | (b3 >> 6) : 64;
    const enc4 = i + 2 < len ? b3 & 63 : 64;
    
    base64 += chars.charAt(enc1) + chars.charAt(enc2) + 
              (enc3 === 64 ? '=' : chars.charAt(enc3)) + 
              (enc4 === 64 ? '=' : chars.charAt(enc4));
  }
  return base64;
};
