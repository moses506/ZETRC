// Minimal types for the vendored qrcode-generator module.
export interface QRCode {
  addData(data: string, mode?: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
  createSvgTag(cellSize?: number, margin?: number): string;
}

declare function qrcode(typeNumber: number, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): QRCode;

export default qrcode;
