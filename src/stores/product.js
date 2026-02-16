import api from "@/lib/axios.js";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
  const loading = ref(false);
  const categoriesLoading = ref(false);
  const error = ref("");
  const categoriesError = ref("");

  const items = ref([]);
  const categories = ref([]);
  const total = ref(0);
  const limit = ref(30);
  const skip = ref(0);

  const productLoading = ref(false);
  const productError = ref("");
  const current = ref(null);

  async function fetchById(id) {
    try {
      productLoading.value = true;
      productError.value = "";

      const pid = Number(id);
      const normalizedId = Number.isFinite(pid) ? pid : id;

      const { data } = await api.get(
        `/products/${encodeURIComponent(normalizedId)}`,
      );
      current.value = data || null;
      return current.value;
    } catch (e) {
      productError.value = e?.message || "Не удалось загрузить продукт";
      current.value = null;
      throw e;
    } finally {
      productLoading.value = false;
    }
  }

  async function fetchCategories() {
    try {
      categoriesLoading.value = true;
      categoriesError.value = "";

      const { data } = await api.get("/products/category-list");
      categories.value = Array.isArray(data) ? data : [];
    } catch (e) {
      categoriesError.value = e?.message || "Не удалось загрузить категории";
      categories.value = [];
    } finally {
      categoriesLoading.value = false;
    }
  }
  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function matchTitleByWordPrefix(title, q) {
    const query = String(q || "")
      .trim()
      .toLowerCase();
    if (!query) return true;

    const t = String(title || "").toLowerCase();

    const re = new RegExp(`\\b${escapeRegExp(query)}`, "i");
    return re.test(t);
  }

  async function fetchList({
    q = "",
    category = "",
    page = 1,
    pageSize = 30,
  } = {}) {
    try {
      loading.value = true;
      error.value = "";

      limit.value = Number(pageSize) > 0 ? Number(pageSize) : 30;
      const normalizedPage = Number(page) > 0 ? Number(page) : 1;
      const nextSkip = (normalizedPage - 1) * limit.value;
      skip.value = nextSkip;

      const baseParams = {
        limit: limit.value,
        skip: skip.value,
      };

      let response;
      const normalizedQ = q?.trim() || "";
      const normalizedCategory = category?.trim() || "";

      if (normalizedQ && normalizedCategory) {
        const { data } = await api.get(
          `/products/category/${encodeURIComponent(normalizedCategory)}`,
          {
            params: {
              limit: 194,
              skip: 0,
            },
          },
        );

        const categoryProducts = Array.isArray(data?.products)
          ? data.products
          : [];
        const filtered = categoryProducts.filter((product) =>
          matchTitleByWordPrefix(product?.title, normalizedQ),
        );

        total.value = filtered.length;
        items.value = filtered.slice(skip.value, skip.value + limit.value);
        return;
      }

      if (normalizedQ) {
        const { data } = await api.get("/products/search", {
          params: {
            q: normalizedQ,
            limit: 200,
            skip: 0,
          },
        });

        const products = Array.isArray(data?.products) ? data.products : [];
        const filtered = products.filter((p) =>
          matchTitleByWordPrefix(p?.title, normalizedQ),
        );

        total.value = filtered.length;
        items.value = filtered.slice(skip.value, skip.value + limit.value);
        return;
      } else if (normalizedCategory) {
        response = await api.get(
          `/products/category/${encodeURIComponent(normalizedCategory)}`,
          {
            params: baseParams,
          },
        );
      } else {
        response = await api.get("/products", {
          params: baseParams,
        });
      }

      const data = response?.data || {};
      items.value = Array.isArray(data.products) ? data.products : [];
      total.value = Number(data.total) || 0;
    } catch (e) {
      error.value = e?.message || "Не удалось загрузить продукты";
      items.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    categoriesLoading,
    error,
    categoriesError,
    items,
    categories,
    total,
    limit,
    skip,
    current,
    productLoading,
    productError,
    fetchList,
    fetchCategories,
    fetchById,
  };
});
