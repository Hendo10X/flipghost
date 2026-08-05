declare module "upng-js" {
  /** Encoder tabs accepted by `UPNG.encode`. `loop` makes the APNG loop. */
  export interface UPNGEncodeTabs {
    loop?: number
  }

  /**
   * The shape of the UPNG object — the same object that `module.exports`
   * points to in the CommonJS source. Bundlers expose it on the default
   * export under ESM, so we mirror that here.
   */
  export const UPNG: {
    /**
     * Encode an APNG from an array of RGBA frame buffers.
     * `dels` is per-frame delay in ms; an empty array is treated as a still.
     * `cnum` of 0 disables palette quantisation (best for full-colour alpha).
     */
    encode(
      bufs: ArrayBuffer[],
      w: number,
      h: number,
      cnum: number,
      dels: number[],
      tabs?: UPNGEncodeTabs
    ): ArrayBuffer
  }

  /**
   * The CommonJS source does `module.exports = UPNG`, which under ESM
   * interop lands the object on the default export. Importing via
   * `import upng from "upng-js"` (or `await import(...)` + `.default`) is
   * the only way to get it at runtime.
   */
  const _default: typeof UPNG
  export default _default
}
