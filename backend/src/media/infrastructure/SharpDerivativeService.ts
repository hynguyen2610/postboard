import sharp from "sharp";

const sourceBaseUrl = "https://raw.githubusercontent.com/yavuzceliker/sample-images/main/docs";
const namePattern = /^image-([1-9]\d{0,2}|1\d{3}|2000)\.jpg$/;
const widths = new Set([320, 480, 640, 960, 1280] as const);
const formats = new Set(["avif", "webp"] as const);

type ImageWidth = typeof widths extends Set<infer Width> ? Width : never;
type ImageFormat = typeof formats extends Set<infer Format> ? Format : never;
export type ImageDerivative = { body: Buffer; contentType: `image/${ImageFormat}` };

export class SharpDerivativeService {
  private readonly cache = new Map<string, ImageDerivative>();
  private readonly inFlight = new Map<string, Promise<ImageDerivative>>();

  async get(input: { name: string; width: unknown; format: unknown }) {
    const width = Number(input.width);
    if (
      !namePattern.test(input.name) ||
      !widths.has(width as ImageWidth) ||
      typeof input.format !== "string" ||
      !formats.has(input.format as ImageFormat)
    ) {
      return { error: "invalid" as const };
    }

    const typedWidth = width as ImageWidth;
    const typedFormat = input.format as ImageFormat;
    const key = `${input.name}:${typedWidth}:${typedFormat}`;
    const cached = this.cache.get(key);
    if (cached) return { derivative: cached } as const;

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = this.create(input.name, typedWidth, typedFormat)
        .then((derivative) => this.cacheDerivative(key, derivative))
        .finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }

    try {
      return { derivative: await pending } as const;
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) } as const;
    }
  }

  private async create(name: string, width: ImageWidth, format: ImageFormat) {
    const source = await fetch(`${sourceBaseUrl}/${name}`);
    if (!source.ok) throw new Error(`upstream image request failed (${source.status})`);
    const body = await sharp(Buffer.from(await source.arrayBuffer()))
      .rotate()
      .resize({ width, fit: "inside", withoutEnlargement: true })
      .toFormat(format, format === "avif" ? { quality: 50, effort: 4 } : { quality: 72 })
      .toBuffer();
    return { body, contentType: `image/${format}` } as ImageDerivative;
  }

  private cacheDerivative(key: string, derivative: ImageDerivative) {
    this.cache.set(key, derivative);
    if (this.cache.size > 128) this.cache.delete(this.cache.keys().next().value!);
    return derivative;
  }
}
