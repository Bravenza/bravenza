import { describe, it, expect } from "vitest";
import { optimizeImageUrl, FALLBACK_PLACEHOLDER } from "../image-utils";

describe("optimizeImageUrl", () => {
  const supabaseUrl =
    "https://example.supabase.co/storage/v1/object/public/photos/img.jpg";

  it("transforms Supabase storage URL to render URL with params", () => {
    const result = optimizeImageUrl(supabaseUrl, { width: 400, height: 300, quality: 75 });
    expect(result).toContain("/storage/v1/render/image/public/");
    expect(result).toContain("width=400");
    expect(result).toContain("height=300");
    expect(result).toContain("quality=75");
  });

  it("adds resize param", () => {
    const result = optimizeImageUrl(supabaseUrl, { resize: "cover" });
    expect(result).toContain("resize=cover");
  });

  it("returns external URLs unchanged", () => {
    const external = "https://cdn.example.com/image.jpg";
    expect(optimizeImageUrl(external, { width: 100 })).toBe(external);
  });

  it("returns empty string for null/undefined", () => {
    expect(optimizeImageUrl(null)).toBe("");
    expect(optimizeImageUrl(undefined)).toBe("");
  });

  it("returns transformed URL without query when no opts given", () => {
    const result = optimizeImageUrl(supabaseUrl);
    expect(result).toContain("/storage/v1/render/image/public/");
    expect(result).not.toContain("?");
  });
});

describe("FALLBACK_PLACEHOLDER", () => {
  it("is a valid data URI SVG", () => {
    expect(FALLBACK_PLACEHOLDER).toMatch(/^data:image\/svg\+xml/);
  });
});
