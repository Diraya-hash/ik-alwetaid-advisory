"use client";
// Client-side exports: SVG diagrams to PNG (styles inlined so the image matches the screen), CSV.
import { downloadFile } from "@/store/workspace";

const PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline", "direction"];

export async function svgToPng(svg: SVGSVGElement, name: string, scale = 2) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = svg.querySelectorAll("*"), dst = clone.querySelectorAll("*");
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const style = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";");
    (dst[i] as SVGElement).setAttribute("style", style);
  });
  const { width, height } = svg.viewBox.baseVal;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const bg = getComputedStyle(document.body).backgroundColor;
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("render")); img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = width * scale; canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
    downloadFile(name, blob, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Arabic text correctly. */
export function toCsv(rows: (string | number)[][]): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return "﻿" + rows.map((r) => r.map(q).join(",")).join("\r\n");
}
