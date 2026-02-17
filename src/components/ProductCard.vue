<script setup>
import { computed, ref, watchEffect } from "vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const FALLBACK = "https://placehold.co/600x400?text=No+Image";

const imgSrc = ref(FALLBACK);

watchEffect(() => {
  const src = props.product?.thumbnail || props.product?.images?.[0] || "";
  imgSrc.value = src || FALLBACK;
});

function onImgError(e) {
  if (imgSrc.value !== FALLBACK) imgSrc.value = FALLBACK;
}
</script>

<template>
  <RouterLink
    v-if="props.product && props.product.id != null"
    :to="`/products/${props.product.id}`"
    class="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
  >
    <div class="aspect-[4/3] w-full overflow-hidden bg-slate-100">
      <img
        v-if="imgSrc"
        :src="imgSrc"
        :alt="product.title"
        @error="onImgError"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-sm text-slate-500"
      >
        Нет изображения
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <h3 class="line-clamp-2 text-sm font-semibold">
          {{ props.product.title }}
        </h3>
        <div
          class="shrink-0 rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
        >
          ${{ props.product.price }}
        </div>
      </div>

      <p class="mt-2 line-clamp-2 text-sm text-slate-600">
        {{ props.product.description }}
      </p>

      <div
        class="mt-3 flex items-center justify-between text-xs text-slate-500"
      >
        <span v-if="categoryLabel" class="rounded-full bg-slate-100 px-2 py-1">
          {{ categoryLabel }}
        </span>
      </div>
    </div>
  </RouterLink>

  <div v-else class="hidden"></div>
</template>
