import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (typeof globalThis.structuredClone !== 'function') {
  const simpleClone = <T>(value: T): T => {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => simpleClone(item)) as unknown as T;
    }

    const cloned: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      cloned[key] = simpleClone(entry);
    }

    return cloned as T;
  };

  globalThis.structuredClone = simpleClone as typeof globalThis.structuredClone;
}
