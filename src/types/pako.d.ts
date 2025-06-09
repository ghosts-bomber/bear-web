declare module "pako" {
  export function inflate(data: Uint8Array | string, options?: any): Uint8Array;
  export function deflate(data: Uint8Array | string, options?: any): Uint8Array;
  export function inflateRaw(data: Uint8Array | string, options?: any): Uint8Array;
  export function deflateRaw(data: Uint8Array | string, options?: any): Uint8Array;
  export function ungzip(data: Uint8Array | string, options?: any): Uint8Array;
  export function gzip(data: Uint8Array | string, options?: any): Uint8Array;
}
