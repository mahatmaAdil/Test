<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductsFilters from "@/components/ProductsFilters.vue";
import ProductCard from "@/components/ProductCard.vue";
import { fetchProducts, fetchCategories } from "@/api/products";

const router = useRouter();
const route = useRoute();

const q = ref("");
const category = ref("__all__");

const categories = ref([]);
const products = ref([]);
const loading = ref(false);
const error = ref("");

// pagination
const page = ref(1);
const perPage = 9;

function asString(v) {
  if (Array.isArray(v)) return v[0] ?? "";
  return typeof v === "string" ? v : "";
}
function asInt(v, fallback = 1) {
  const n = Number.parseInt(asString(v), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readFromUrl() {
  page.value = asInt(route.query.page, 1);
  q.value = asString(route.query.q);
  category.value = asString(route.query.category) || "__all__";
}

function writeToUrl() {
  const next = {
    ...(q.value.trim() ? { q: q.value.trim() } : {}),
    ...(category.value && category.value !== "__all__"
      ? { category: category.value }
      : {}),
    ...(page.value > 1 ? { page: String(page.value) } : {}),
  };

  const curr = new URLSearchParams(route.query).toString();
  const nxt = new URLSearchParams(next).toString();
  if (curr === nxt) return;

  router.replace({ query: next });
}

// prefix search helpers
const words = (s) =>
  String(s ?? "")
    .toLowerCase()
    .trim()
    .split(/[\s\-_/.,()]+/)
    .filter(Boolean);

const visibleProducts = computed(() => {
  let result = products.value;

  if (category.value && category.value !== "__all__") {
    result = result.filter((p) => p.category === category.value);
  }

  if (q.value.trim()) {
    const needle = q.value.trim().toLowerCase();

    // prefix search: title startsWith OR any word startsWith
    result = result.filter((p) => {
      const title = String(p.title ?? "")
        .toLowerCase()
        .trim();
      if (title.startsWith(needle)) return true;
      return words(title).some((w) => w.startsWith(needle));
    });

    // best matches first
    const score = (p) => {
      const title = String(p.title ?? "")
        .toLowerCase()
        .trim();
      if (title.startsWith(needle)) return 0;
      if (words(title).some((w) => w.startsWith(needle))) return 1;
      return 9;
    };

    result = [...result].sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
  }

  return result;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(visibleProducts.value.length / perPage)),
);

const pagedProducts = computed(() => {
  const start = (page.value - 1) * perPage;
  return visibleProducts.value.slice(start, start + perPage);
});

// keep page valid
watch(totalPages, () => {
  if (page.value > totalPages.value) page.value = totalPages.value;
  if (page.value < 1) page.value = 1;
});

// URL -> state (back/forward/manual change)
watch(
  () => route.query,
  () => {
    readFromUrl();
  },
);

// state -> URL
watch([q, category], () => {
  page.value = 1;
  writeToUrl();
});

watch(page, () => {
  writeToUrl();
});

async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetchProducts(100);
    products.value = res.products;

    categories.value = await fetchCategories();
  } catch (e) {
    error.value = e?.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  q.value = "";
  category.value = "__all__";
  page.value = 1;
  writeToUrl();
}

function prevPage() {
  if (page.value > 1) page.value -= 1;
}

function nextPage() {
  if (page.value < totalPages.value) page.value += 1;
}

function goToPage(p) {
  const next = Math.min(Math.max(1, p), totalPages.value);
  page.value = next;
}

onMounted(async () => {
  readFromUrl();
  await loadData();
});
</script>

<template>
  <div class="">
    <ProductsFilters
      v-model:q="q"
      v-model:category="category"
      :categories="categories"
      @reset="resetFilters"
    />

    <div class="w-full mt-6">
      <div
        v-if="loading"
        class="w-full rounded-2xl border bg-white p-6 text-sm text-slate-600"
      >
        Загрузка…
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border bg-white p-6 text-sm text-red-600"
      >
        {{ error }}
      </div>

      <div v-else>
        <div class="mb-3 text-sm text-slate-600">
          Найдено:
          <span class="font-semibold text-slate-900">
            {{ visibleProducts.length }}
          </span>
        </div>
        <div
          class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <template v-if="visibleProducts.length">
            <ProductCard v-for="p in pagedProducts" :key="p.id" :product="p" />
          </template>

          <div
            v-else
            class="w-full rounded-2xl border bg-white p-6 text-sm text-slate-600 sm:col-span-2 lg:col-span-3"
          >
            Ничего не найдено.
          </div>
        </div>

        <div
          v-if="totalPages > 1"
          class="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            class="h-9 rounded-md border bg-white px-3 text-sm transition hover:bg-slate-50 disabled:opacity-50"
            :disabled="page === 1"
            @click="prevPage"
          >
            Назад
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            class="h-9 min-w-9 rounded-md border px-3 text-sm transition"
            :class="
              p === page
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50'
            "
            @click="goToPage(p)"
          >
            {{ p }}
          </button>

          <button
            type="button"
            class="h-9 rounded-md border bg-white px-3 text-sm transition hover:bg-slate-50 disabled:opacity-50"
            :disabled="page === totalPages"
            @click="nextPage"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
