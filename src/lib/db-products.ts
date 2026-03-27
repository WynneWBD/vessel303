import { pool } from './db';
import type { ProductData, ProductFeature, ProductSpace, ProductMaterial } from './products';

interface ProductRow {
  slug: string;
  model: string;
  gen: string;
  series: string;
  tag: string;
  size: string;
  tagline: string;
  tagline2: string;
  floor_area: string;
  power: string;
  weight: string;
  capacity: string;
  design_philosophy: string;
  badge: string;
  image: string;
  accent_color: string;
  price_display: string;
  price_hidden: string;
  prev_slug: string | null;
  next_slug: string | null;
  dimensions: { length: number; width: number; height: number };
  zones: string[];
  features: ProductFeature[];
  spaces: ProductSpace[];
  materials: ProductMaterial[];
}

function rowToProduct(row: ProductRow): ProductData {
  return {
    slug: row.slug as ProductData['slug'],
    model: row.model,
    gen: row.gen,
    series: row.series as ProductData['series'],
    tag: row.tag,
    size: row.size,
    tagline: row.tagline,
    tagline2: row.tagline2,
    floorArea: row.floor_area,
    power: row.power,
    weight: row.weight,
    capacity: row.capacity,
    designPhilosophy: row.design_philosophy,
    badge: row.badge,
    image: row.image,
    accentColor: row.accent_color,
    priceDisplay: row.price_display,
    priceHidden: row.price_hidden,
    prev: (row.prev_slug ?? undefined) as ProductData['prev'],
    next: (row.next_slug ?? undefined) as ProductData['next'],
    dimensions: row.dimensions,
    zones: row.zones,
    features: row.features,
    spaces: row.spaces,
    materials: row.materials,
  };
}

const SELECT = `
  slug, model, gen, series, tag, size, tagline, tagline2,
  floor_area, power, weight, capacity, design_philosophy,
  badge, image, accent_color, price_display, price_hidden,
  prev_slug, next_slug, dimensions, zones, features, spaces, materials
`;

export async function getAllProducts(): Promise<ProductData[]> {
  const { rows } = await pool.query<ProductRow>(
    `SELECT ${SELECT} FROM products ORDER BY sort_order ASC`,
  );
  return rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<ProductData | null> {
  const { rows } = await pool.query<ProductRow>(
    `SELECT ${SELECT} FROM products WHERE slug = $1`,
    [slug],
  );
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function getProductsBySeries(series: string): Promise<ProductData[]> {
  const { rows } = await pool.query<ProductRow>(
    `SELECT ${SELECT} FROM products WHERE series = $1 ORDER BY sort_order ASC`,
    [series],
  );
  return rows.map(rowToProduct);
}
