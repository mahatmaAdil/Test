<script setup>
import { SelectItemText } from "reka-ui";

const props = defineProps();
</script>

<template>
  <SelectItemText v-bind="props">
    <slot />
  </SelectItemText>
</template>
