<script setup>
const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <RouterLink
    v-if="props.product && props.product.id != null"
    :to="`/products/${props.product.id}`"
    class="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
  >
    <div class="aspect-[4/3] w-full overflow-hidden bg-slate-100">
      <img
        v-if="props.product.thumbnail"
        :src="props.product.thumbnail"
        :alt="props.product.title"
        class="h-full w-full object-cover transition group-hover:scale-[1.02]"
        loading="lazy"
      />
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
        <span class="rounded-full bg-slate-100 px-2 py-1">{{
          props.product.category
        }}</span>
        <span v-if="props.product.rating">★ {{ props.product.rating }}</span>
      </div>
    </div>
  </RouterLink>

  <div v-else class="hidden"></div>
</template>
