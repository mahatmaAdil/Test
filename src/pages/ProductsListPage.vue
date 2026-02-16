<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductsFilters from "@/components/ProductsFilters.vue";
import ProductCard from "@/components/ProductCard.vue";
import { Spinner } from "@/components/ui/spinner";
import { useProductStore } from "@/stores/product.js";

const store = useProductStore();
const router = useRouter();
const route = useRoute();

const q = ref("");
const category = ref("");
const page = ref(1);
const per_page = 30;
const debounceDelay = 500;

let searchDebounceId = null;

const isSyncingFromRoute = ref(false);

const totalPages = computed(() => {
  if (!store.total || !store.limit) return 1;
  return Math.max(1, Math.ceil(store.total / store.limit));
});

const hasActiveFilters = computed(() =>
  Boolean(q.value.trim() || category.value),
);
const isCatalogEmpty = computed(
  () =>
    !store.loading &&
    !store.error &&
    store.total === 0 &&
    !hasActiveFilters.value,
);
const isNoResults = computed(
  () =>
    !store.loading &&
    !store.error &&
    store.total === 0 &&
    hasActiveFilters.value,
);

function normalizePage(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function sanitizeText(raw) {
  return typeof raw === "string" ? raw.trim() : "";
}

function applyRouteToLocalState() {
  isSyncingFromRoute.value = true;
  q.value = sanitizeText(route.query.q);
  category.value = sanitizeText(route.query.category);
  page.value = normalizePage(route.query.page);
  isSyncingFromRoute.value = false;
}

async function fetchByCurrentState() {
  if (!store.categories.length && !store.categoriesLoading) {
    await store.fetchCategories();
  }
  await store.fetchList({
    q: q.value,
    category: category.value,
    page: page.value,
    pageSize: per_page,
  });

  if (page.value > totalPages.value) {
    await updateRoute({
      page: totalPages.value,
    });
  }
}

async function updateRoute({
  q: nextQ = q.value,
  category: nextCategory = category.value,
  page: nextPage = page.value,
} = {}) {
  const normalizedQ = sanitizeText(nextQ);
  const normalizedCategory = sanitizeText(nextCategory);
  const normalizedPage = normalizePage(nextPage);

  const nextQuery = {};
  if (normalizedQ) nextQuery.q = normalizedQ;
  if (normalizedCategory) nextQuery.category = normalizedCategory;
  if (normalizedPage > 1) nextQuery.page = String(normalizedPage);

  const currentQuery = {
    q: sanitizeText(route.query.q),
    category: sanitizeText(route.query.category),
    page:
      normalizePage(route.query.page) > 1
        ? String(normalizePage(route.query.page))
        : "",
  };
  const targetQuery = {
    q: normalizedQ,
    category: normalizedCategory,
    page: normalizedPage > 1 ? String(normalizedPage) : "",
  };

  if (
    currentQuery.q === targetQuery.q &&
    currentQuery.category === targetQuery.category &&
    currentQuery.page === targetQuery.page
  ) {
    return;
  }

  await router.replace({ query: nextQuery });
}

function queueSearchUpdate() {
  if (searchDebounceId) {
    clearTimeout(searchDebounceId);
  }

  searchDebounceId = setTimeout(() => {
    updateRoute({ q: q.value, page: 1 });
  }, debounceDelay);
}

function resetFilters() {
  q.value = "";
  category.value = "";
  updateRoute({ q: "", category: "", page: 1 });
}

function goToPage(nextPage) {
  const target = normalizePage(nextPage);
  if (target === page.value) return;
  updateRoute({ page: target });
}

function prevPage() {
  if (page.value <= 1) return;
  goToPage(page.value - 1);
}

function nextPage() {
  if (page.value >= totalPages.value) return;
  goToPage(page.value + 1);
}

watch(
  () => route.query,
  () => {
    applyRouteToLocalState();
    fetchByCurrentState();
  },
  { immediate: true },
);

watch(category, () => {
  if (isSyncingFromRoute.value) return;
  updateRoute({ category: category.value, page: 1 });
});

watch(q, () => {
  if (isSyncingFromRoute.value) return;
  queueSearchUpdate();
});

onMounted(() => {
  applyRouteToLocalState();
});

onBeforeUnmount(() => {
  if (searchDebounceId) {
    clearTimeout(searchDebounceId);
  }
});
</script>

<template>
  <div>
    <ProductsFilters
      v-model:q="q"
      v-model:category="category"
      :categories="store.categories"
      @reset="resetFilters"
    />

    <div class="w-full flex justify-center items-center h-full mt-6">
      <Spinner v-if="store.loading" class="size-12" />
      <div
        v-else-if="store.error"
        class="w-full rounded-2xl border bg-white p-6 text-sm text-red-600"
      >
        {{ store.error }}
      </div>

      <div v-else class="w-full">
        <div
          v-if="isCatalogEmpty"
          class="rounded-2xl border bg-white p-10 text-center"
        >
          <h2 class="text-lg font-semibold text-slate-900">
            Каталог пока пуст
          </h2>
          <p class="mt-2 text-sm text-slate-600">
            API вернул пустой список товаров. Попробуйте обновить страницу
            позже.
          </p>
        </div>
        <div v-else>
          <div class="mb-3 text-sm text-slate-600">
            Найдено:
            <span class="font-semibold text-slate-900">{{ store.total }}</span>
          </div>

          <div
            class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <template v-if="store.items.length">
              <ProductCard v-for="p in store.items" :key="p.id" :product="p" />
            </template>
            <div
              v-else-if="isNoResults"
              class="w-full rounded-2xl border bg-white p-6 text-sm text-slate-600 sm:col-span-2 lg:col-span-3"
            >
              Ничего не найдено. Попробуйте изменить поиск или категорию.
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
  </div>
</template>
