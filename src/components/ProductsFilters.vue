<script setup>
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

const props = defineProps({
  q: { type: String, default: "" },
  category: { type: String, default: "" }, // slug или ""
  categories: { type: Array, default: () => [] }, // string[] или object[]
});

const emit = defineEmits(["update:q", "update:category", "reset"]);

const categoriesUi = computed(() => {
  const raw = props.categories ?? [];
  return raw
    .map((c) => {
      if (typeof c === "string") {
        const slug = c;
        const label = c
          .split("-")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
          .join(" ");
        return { slug, label };
      }
      const slug = String(c.slug ?? c.value ?? c.id ?? "");
      const label = String(c.name ?? c.title ?? c.label ?? slug);
      return { slug, label };
    })
    .filter((x) => x.slug)
    .sort((a, b) => a.label.localeCompare(b.label));
});

const selectValue = computed(() => props.category || ALL);

function onCategoryChange(val) {
  const v = typeof val === "string" ? val : ALL;
  emit("update:category", v === ALL ? "" : v);
}
function onReset() {
  emit("reset");
}
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="w-full sm:max-w-sm flex">
      <Input
        :model-value="q"
        @update:model-value="(v) => emit('update:q', String(v ?? ''))"
        placeholder="Поиск по названию..."
      />
      <button
        type="button"
        class="h-10 px-4 rounded-md border text-sm transition whitespace-nowrap flex items-center justify-center"
        :class="
          q?.trim() || category !== '__all__'
            ? 'border-black text-gostwhite hover:bg-Black'
            : 'border-slate-200 text-slate-400 cursor-not-allowed'
        "
        :disabled="!(q?.trim() || category !== '__all__')"
        @click="onReset"
      >
        Очистить
      </button>
    </div>

    <div class="w-full sm:max-w-xs">
      <Select :model-value="selectValue" @update:model-value="onCategoryChange">
        <SelectTrigger>
          <SelectValue placeholder="Категория (все)" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem :value="ALL">Все категории</SelectItem>

          <SelectItem v-for="c in categoriesUi" :key="c.slug" :value="c.slug">
            {{ c.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
