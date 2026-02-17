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
  categoryId: { type: [String, Number], default: "" },
  categories: { type: Array, default: () => [] }, // [{id,label}]
});

const emit = defineEmits(["update:q", "update:categoryId", "reset"]);

const categoriesUi = computed(() => {
  const raw = props.categories ?? [];
  return raw
    .map((c) => ({ id: Number(c?.id), label: String(c?.label ?? "").trim() }))
    .filter((c) => Number.isFinite(c.id))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const selectValue = computed(() => {
  const cid = Number(props.categoryId);
  return Number.isFinite(cid) && cid > 0 ? String(cid) : ALL;
});

const hasActiveFilters = computed(() =>
  Boolean(props.q?.trim() || Number(props.categoryId) > 0),
);

function onCategoryChange(val) {
  const v = typeof val === "string" ? val : ALL;
  emit("update:categoryId", v === ALL ? "" : v);
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
        class="h-9 px-4 rounded-md border text-sm transition whitespace-nowrap flex items-center justify-center"
        :class="
          hasActiveFilters
            ? 'border-slate-900 text-black hover:bg-slate-900 hover:text-white'
            : 'border-slate-200 text-slate-400 '
        "
        :disabled="!hasActiveFilters"
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
          <SelectItem
            v-for="c in categoriesUi"
            :key="c.id"
            :value="String(c.id)"
          >
            {{ c.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
