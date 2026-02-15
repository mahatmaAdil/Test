const BASE = "https://dummyjson.com";

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchProducts(limit = 100, skip = 0) {
  return getJson(`${BASE}/products?limit=${limit}&skip=${skip}`);
}

export async function fetchCategories() {
  return getJson(`${BASE}/products/categories`);
}

// основной вариант (короткое имя)
export async function fetchProduct(id) {
  return getJson(`${BASE}/products/${id}`);
}

// совместимость со старым импортом
export const fetchProductById = fetchProduct;
