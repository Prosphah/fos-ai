import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Money Mastery Code — financial literacy, without the fluff. Eight recorded lectures, from N15,000.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_DIR = path.join(process.cwd(), "src", "lib", "og-fonts");

/**
 * Loads a committed font subset as an ArrayBuffer.
 *
 * Must slice the underlying buffer rather than passing it straight through.
 * Node allocates Buffers from a shared pool, so `buffer.buffer` can be
 * several times larger than the font and can begin at a non-zero offset.
 * Handing Satori the whole pool makes it read past the end of the file.
 */
async function loadFont(name: string): Promise<ArrayBuffer> {
  const file = await readFile(path.join(FONT_DIR, `${name}.ttf`));

  return file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
}

/**
 * The Open Graph card for the storefront.
 *
 * Generated rather than shipped as a static file because the three variants
 * change copy independently, and a card that falls behind the page it links to
 * is worse than no card: WhatsApp and TikTok cache these hard, so a stale one
 * can outlive the fix by weeks.
 *
 * Satori, which renders this, supports a subset of CSS: flexbox only, no grid,
 * and every element with more than one child needs an explicit display.
 *
 * The fonts are committed rather than fetched. Left to its own devices Satori
 * asks Google for any glyph it cannot find, and that request fails for the
 * naira sign, which rendered as a tofu box in both places it appears. These
 * subsets carry the naira sign and full printable ASCII and total around 90KB,
 * so the build needs no network and cannot silently regress to boxes.
 */
export default async function OpenGraphImage() {
  const [inter400, inter700, sora700] = await Promise.all([
    loadFont("Inter-400"),
    loadFont("Inter-700"),
    loadFont("Sora-700"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0f0a",
          padding: "72px 80px",
          color: "#f4f3eb",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#d5ff65",
              color: "#0d0f0a",
              fontSize: 30,
              fontWeight: 700,
              marginRight: 20,
            }}
          >
            ₦
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
            Money Mastery Code
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Sora",
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-3px",
              marginBottom: 28,
            }}
          >
            Make money. Manage money. Multiply money.
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#a9ad9f" }}>
            Eight recorded lectures. Taught from zero.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#d5ff65" }}>
            From ₦15,000
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#7c8074" }}>
            mmc.betiangli.xyz
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Sora", data: sora700, weight: 700, style: "normal" },
      ],
    },
  );
}