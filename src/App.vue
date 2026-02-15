<script setup></script>

<template>
  <div class="w-full min-h-dvh bg-slate-50 text-slate-900">
    <header class="border-b bg-white">
      <div class="mx-auto w-full max-w-6xl px-4 py-4">
        <router-link to="/" class="text-lg font-semibold"> </router-link>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
