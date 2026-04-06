#!/usr/bin/env node
/**
 * Syncs products from Authentifactor API to Astro content markdown files.
 * Run: node sync-products.mjs
 */

const API_URL = "https://authentifactor.com/api/storefront/products?tenant=styled-by-maryam";
const PRODUCTS_DIR = "./src/content/products";

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

async function sync() {
  console.log("Fetching products from Authentifactor...");
  const res = await fetch(API_URL);
  const data = await res.json();

  if (!data.products) {
    console.error("Failed to fetch:", data);
    process.exit(1);
  }

  console.log(`Got ${data.products.length} products`);
  mkdirSync(PRODUCTS_DIR, { recursive: true });

  // Map Authentifactor categories to Astro categories
  const categoryMap = {
    "Dresses": "evening",
    "Mini Dresses": "evening",
    "Blazers & Jackets": "ready-to-wear",
    "Knitwear": "ready-to-wear",
    "Coats & Outerwear": "ready-to-wear",
    "Trousers & Skirts": "ready-to-wear",
    "Scarves": "accessories",
    "Belts": "accessories",
    "Earrings": "accessories",
    "Bags": "accessories",
    "Jewellery": "accessories",
  };

  const validCategories = ["evening", "ready-to-wear", "accessories"];

  for (const product of data.products) {
    // Map category
    let category = categoryMap[product.category] || categoryMap[product.subcategory] || "ready-to-wear";
    if (!validCategories.includes(category)) category = "ready-to-wear";

    // Map colors to the format Astro expects
    const colors = (product.colors || []).map(name => {
      const hexMap = {
        "Black": "#111111", "Ivory": "#FFFFF0", "Burgundy": "#800020",
        "Gold": "#C5A059", "Silver": "#C0C0C0", "Rose Gold": "#B76E79",
        "Tan": "#D2B48C", "Navy": "#000080", "Blush": "#F7E7CE",
        "Lemon Sorbet": "#FFF44F", "Yellow": "#FFD700", "Red": "#CC0000",
        "White": "#FFFFFF", "Camel": "#C19A6B",
      };
      return { name, hex: hexMap[name] || "#888888" };
    });

    // Build frontmatter
    const frontmatter = {
      name: product.name,
      price: product.salePrice || product.price,
      description: product.shortDescription || product.description?.slice(0, 200) || "",
      image: product.images?.[0] || "",
      images: product.images || [],
      category,
      colors: colors.length > 0 ? colors : undefined,
      sizes: product.sizes?.length > 0 ? product.sizes : undefined,
      featured: false,
      soldOut: !product.inStock,
      publishDate: new Date().toISOString().split("T")[0],
    };

    // Build markdown
    const yaml = [];
    yaml.push("---");
    yaml.push(`name: "${frontmatter.name.replace(/"/g, '\\"')}"`);
    yaml.push(`price: ${frontmatter.price}`);
    yaml.push(`description: "${frontmatter.description.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);
    if (frontmatter.image) yaml.push(`image: "${frontmatter.image}"`);
    if (frontmatter.images?.length > 0) {
      yaml.push("images:");
      for (const img of frontmatter.images) yaml.push(`  - "${img}"`);
    }
    yaml.push(`category: "${frontmatter.category}"`);
    if (frontmatter.colors?.length > 0) {
      yaml.push("colors:");
      for (const c of frontmatter.colors) yaml.push(`  - { name: "${c.name}", hex: "${c.hex}" }`);
    }
    if (frontmatter.sizes?.length > 0) {
      yaml.push(`sizes: [${frontmatter.sizes.map(s => `"${s}"`).join(", ")}]`);
    }
    yaml.push(`featured: ${frontmatter.featured}`);
    yaml.push(`soldOut: ${frontmatter.soldOut}`);
    yaml.push(`publishDate: ${frontmatter.publishDate}`);
    yaml.push("---");
    yaml.push("");
    yaml.push(product.description || "");

    const filename = `${product.slug}.md`;
    const filepath = join(PRODUCTS_DIR, filename);
    writeFileSync(filepath, yaml.join("\n"));
    console.log(`  ✓ ${filename}`);
  }

  console.log(`\nDone! ${data.products.length} products synced.`);
}

sync().catch(console.error);
