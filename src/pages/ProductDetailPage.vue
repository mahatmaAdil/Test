<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchProductById } from "@/api/products";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const route = useRoute();

const loading = ref(false);
const error = ref("");
const product = ref(null);

const activeImage = ref("");

async function load(id) {
  loading.value = true;
  error.value = "";
  try {
    // иногда route.params.id строка — приводим к числу (не обязательно, но полезно)
    const pid = Number(id);
    product.value = await fetchProductById(Number.isFinite(pid) ? pid : id);
  } catch (e) {
    error.value = e?.message || "Не удалось загрузить продукт";
    product.value = null;
  } finally {
    loading.value = false;
  }
}

// выставляем картинку когда загрузился продукт
watch(product, (p) => {
  activeImage.value = p?.thumbnail || p?.images?.[0] || "";
});

// если переходишь между товарами по роуту, не перезагружая страницу — обновляем
watch(
  () => route.params.id,
  (id) => {
    if (id != null) load(id);
  },
  { immediate: true },
);
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <RouterLink to="/">
        <Button variant="outline">← Назад</Button>
      </RouterLink>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div v-if="loading" class="grid gap-6 lg:grid-cols-2">
      <Skeleton class="h-80 w-full" />
      <div class="space-y-3">
        <Skeleton class="h-7 w-3/4" />
        <Skeleton class="h-5 w-1/3" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-10 w-40" />
      </div>
    </div>

    <div v-else-if="product" class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="aspect-[4/3] overflow-hidden rounded-xl border bg-white">
          <img
            v-if="activeImage"
            :src="activeImage"
            :alt="product.title"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-sm text-slate-500"
          >
            Нет изображения
          </div>
        </div>

        <div
          v-if="product.images?.length"
          class="flex gap-2 overflow-auto pb-1"
        >
          <button
            v-for="img in product.images"
            :key="img"
            class="h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-white hover:shadow"
            type="button"
            @click="activeImage = img"
          >
            <img
              :src="img"
              :alt="product.title"
              class="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold">{{ product.title }}</h1>
            <Badge variant="secondary">{{ product.category }}</Badge>
          </div>
          <p class="text-slate-600">{{ product.description }}</p>
        </div>

        <div class="flex items-end gap-4">
          <div class="text-3xl font-bold">${{ product.price }}</div>
          <div v-if="product.discountPercentage" class="text-sm text-slate-600">
            скидка {{ product.discountPercentage }}%
          </div>
        </div>

        <div class="flex gap-3">
          <Button>Купить</Button>
          <Button variant="outline">В избранное</Button>
        </div>

        <div class="space-y-1 text-sm text-slate-600">
          <div v-if="product.brand">
            Бренд: <span class="text-slate-900">{{ product.brand }}</span>
          </div>
          <div v-if="product.stock != null">
            Остаток: <span class="text-slate-900">{{ product.stock }}</span>
          </div>
          <div v-if="product.rating != null">
            Рейтинг: <span class="text-slate-900">{{ product.rating }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
