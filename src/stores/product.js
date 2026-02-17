import api from "@/lib/axios.js";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
  const loading = ref(false);
  const error = ref("");

  const items = ref([]);

  const categoriesLoading = ref(false);
  const categoriesError = ref("");
  // [{ id, label }]
  const categories = ref([]);

  const productLoading = ref(false);
  const productError = ref("");
  const current = ref(null);

  function sanitizeText(raw) {
    return typeof raw === "string" ? raw.trim() : "";
  }

  async function fetchList({ q = "", categoryId = "" } = {}) {
    try {
      loading.value = true;
      error.value = "";

      const params = {};

      const title = sanitizeText(q);
      if (title) params.title = title;

      const cid = Number(categoryId);
      if (Number.isFinite(cid) && cid > 0) params.categoryId = cid;

      const { data } = await api.get("/products", { params });
      items.value = Array.isArray(data) ? data : [];
    } catch (e) {
      error.value = e?.message || "Не удалось загрузить продукты";
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategories() {
    try {
      categoriesLoading.value = true;
      categoriesError.value = "";

      const { data } = await api.get("/categories");
      const raw = Array.isArray(data) ? data : [];

      const BASE_CATEGORY_SLUGS = new Set([
        "clothes",
        "electronics",
        "shoes",
        "furniture",
        "others",
        "miscellaneous",
      ]);

      const normalized = raw
        .map((c) => {
          const id = Number(c?.id);
          const slug = String(c?.slug ?? "")
            .trim()
            .toLowerCase();
          const label = String(c?.name ?? "").trim();

          if (!Number.isFinite(id) || !slug) return null;

          return { id, slug, label: label || slug };
        })
        .filter(Boolean)
        .filter((c) => BASE_CATEGORY_SLUGS.has(c.slug));

      const uniq = new Map();
      for (const c of normalized) {
        if (!uniq.has(c.id)) uniq.set(c.id, c);
      }

      categories.value = Array.from(uniq.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    } catch (e) {
      categoriesError.value = e?.message || "Не удалось загрузить категории";
      categories.value = [];
    } finally {
      categoriesLoading.value = false;
    }
  }

  async function fetchById(id) {
    try {
      productLoading.value = true;
      productError.value = "";

      const { data } = await api.get(`/products/${id}`);
      current.value = data ?? null;
    } catch (e) {
      productError.value = e?.message || "Ошибка загрузки продукта";
      current.value = null;
    } finally {
      productLoading.value = false;
    }
  }

  return {
    loading,
    error,
    items,

    categoriesLoading,
    categoriesError,
    categories,

    current,
    productLoading,
    productError,

    fetchList,
    fetchCategories,
    fetchById,
  };
});
