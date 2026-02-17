<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useProductStore } from "@/stores/product.js";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const route = useRoute();
const store = useProductStore();

const activeImage = ref("");

watch(
  () => store.current,
  (p) => {
    // Platzi: images: string[], обычно без thumbnail
    activeImage.value = p?.images?.[0] || "";
  },
  { immediate: true },
);

watch(
  () => route.params.id,
  async (id) => {
    if (id == null) return;
    await store.fetchById(Number(id));
  },
  { immediate: true },
);

const router = useRouter();
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <Button variant="outline" @click="router.back()"> ← Назад </Button>
    </div>

    <div
      v-if="store.productError"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ store.productError }}
    </div>

    <div v-if="store.productLoading" class="grid gap-6 lg:grid-cols-2">
      <Skeleton class="h-80 w-full" />
      <div class="space-y-3">
        <Skeleton class="h-7 w-3/4" />
        <Skeleton class="h-5 w-1/3" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-10 w-40" />
      </div>
    </div>

    <div v-else-if="store.current" class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="aspect-[4/3] overflow-hidden rounded-xl border bg-white">
          <img
            v-if="activeImage"
            :src="activeImage"
            :alt="store.current.title"
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
          v-if="store.current.images?.length"
          class="flex gap-2 overflow-auto pb-1"
        >
          <button
            v-for="img in store.current.images"
            :key="img"
            class="h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-white hover:shadow"
            type="button"
            @click="activeImage = img"
          >
            <img
              :src="img"
              :alt="store.current.title"
              class="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold">{{ store.current.title }}</h1>
            <Badge variant="secondary">
              {{
                store.current.category?.name ||
                store.current.category?.slug ||
                "—"
              }}
            </Badge>
          </div>
          <p class="text-slate-600">{{ store.current.description }}</p>
        </div>

        <div class="flex items-end gap-4">
          <div class="text-3xl font-bold">${{ store.current.price }}</div>
          <div
            v-if="store.current.discountPercentage"
            class="text-sm text-slate-600"
          >
            скидка {{ store.current.discountPercentage }}%
          </div>
        </div>

        <div class="flex gap-3">
          <Button>Купить</Button>
          <Button variant="outline">В избранное</Button>
        </div>

        <div class="space-y-1 text-sm text-slate-600">
          <div v-if="store.current.brand">
            Бренд: <span class="text-slate-900">{{ store.current.brand }}</span>
          </div>
          <div v-if="store.current.stock != null">
            Остаток:
            <span class="text-slate-900">{{ store.current.stock }}</span>
          </div>
          <div v-if="store.current.rating != null">
            Рейтинг:
            <span class="text-slate-900">{{ store.current.rating }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
