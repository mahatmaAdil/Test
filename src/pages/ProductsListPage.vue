<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductsFilters from "@/components/ProductsFilters.vue";
import ProductCard from "@/components/ProductCard.vue";
import { Spinner } from "@/components/ui/spinner";
import { useProductStore } from "@/stores/product.js";

const store = useProductStore();
const router = useRouter();
const route = useRoute();

const q = ref("");
const categoryId = ref("");
const page = ref(1);

const per_page = 30;
const debounceDelay = 500;

let searchDebounceId = null;
const isSyncingFromRoute = ref(false);

function normalizePage(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
function sanitizeText(raw) {
  return typeof raw === "string" ? raw.trim() : "";
}
function normalizeCategoryId(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "";
}

const hasActiveFilters = computed(() =>
  Boolean(q.value.trim() || Number(categoryId.value) > 0),
);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(store.items.length / per_page));
});

const paginatedItems = computed(() => {
  const p = Math.min(page.value, totalPages.value);
  const start = (p - 1) * per_page;
  return store.items.slice(start, start + per_page);
});

const canPrev = computed(() => page.value > 1);
const canNext = computed(() => page.value < totalPages.value);

const isCatalogEmpty = computed(
  () =>
    !store.loading &&
    !store.error &&
    store.items.length === 0 &&
    !hasActiveFilters.value,
);

const isNoResults = computed(
  () =>
    !store.loading &&
    !store.error &&
    store.items.length === 0 &&
    hasActiveFilters.value,
);

function applyRouteToLocalState() {
  isSyncingFromRoute.value = true;
  q.value = sanitizeText(route.query.q);
  categoryId.value = normalizeCategoryId(route.query.categoryId);
  page.value = normalizePage(route.query.page);
  isSyncingFromRoute.value = false;
}

async function updateRoute({
  q: nextQ = q.value,
  categoryId: nextCategoryId = categoryId.value,
  page: nextPage = page.value,
} = {}) {
  const normalizedQ = sanitizeText(nextQ);
  const normalizedCategoryId = normalizeCategoryId(nextCategoryId);
  const normalizedPage = normalizePage(nextPage);

  const nextQuery = {};
  if (normalizedQ) nextQuery.q = normalizedQ;
  if (normalizedCategoryId) nextQuery.categoryId = normalizedCategoryId;
  if (normalizedPage > 1) nextQuery.page = String(normalizedPage);

  await router.replace({ query: nextQuery });
}

async function fetchByCurrentState() {
  if (!store.categories.length && !store.categoriesLoading) {
    await store.fetchCategories();
  }

  await store.fetchList({ q: q.value, categoryId: categoryId.value });

  if (page.value > totalPages.value) {
    await updateRoute({ page: totalPages.value });
  }
}

function queueSearchUpdate() {
  if (searchDebounceId) clearTimeout(searchDebounceId);
  searchDebounceId = setTimeout(() => {
    updateRoute({ q: q.value, page: 1 });
  }, debounceDelay);
}

function resetFilters() {
  q.value = "";
  categoryId.value = "";
  updateRoute({ q: "", categoryId: "", page: 1 });
}

function goToPage(nextPage) {
  const target = normalizePage(nextPage);
  if (target === page.value) return;
  updateRoute({ page: target });
}
function prevPage() {
  if (!canPrev.value) return;
  goToPage(page.value - 1);
}
function nextPage() {
  if (!canNext.value) return;
  goToPage(page.value + 1);
}

watch(
  () => route.query,
  async () => {
    applyRouteToLocalState();
    await fetchByCurrentState();
  },
  { immediate: true },
);

watch(categoryId, () => {
  if (isSyncingFromRoute.value) return;
  updateRoute({ categoryId: categoryId.value, page: 1 });
});

watch(q, () => {
  if (isSyncingFromRoute.value) return;
  queueSearchUpdate();
});

onBeforeUnmount(() => {
  if (searchDebounceId) clearTimeout(searchDebounceId);
});
</script>

<template>
  <div>
    <ProductsFilters
      v-model:q="q"
      v-model:categoryId="categoryId"
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
            Всего найдено:
            <span class="font-semibold text-slate-900">{{
              store.items.length
            }}</span>
          </div>

          <div
            class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <template v-if="paginatedItems.length">
              <ProductCard
                v-for="p in paginatedItems"
                :key="p.id"
                :product="p"
              />
            </template>

            <div
              v-else-if="isNoResults"
              class="w-full rounded-2xl border bg-white p-6 text-sm text-slate-600 sm:col-span-2 lg:col-span-3"
            >
              Ничего не найдено. Попробуйте изменить поиск или категорию.
            </div>
          </div>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              class="h-9 rounded-md border bg-white px-3 text-sm transition hover:bg-slate-50 disabled:opacity-50"
              :disabled="!canPrev"
              @click="prevPage"
            >
              Назад
            </button>

            <div class="px-2 text-sm text-slate-600">
              Страница
              <span class="font-semibold text-slate-900">{{ page }}</span>
              из
              <span class="font-semibold text-slate-900">{{ totalPages }}</span>
            </div>

            <button
              type="button"
              class="h-9 rounded-md border bg-white px-3 text-sm transition hover:bg-slate-50 disabled:opacity-50"
              :disabled="!canNext"
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
