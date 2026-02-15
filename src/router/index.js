import { createRouter, createWebHistory } from "vue-router";
import ProductsListPage from "@/pages/ProductsListPage.vue";
import ProductDetailPage from "@/pages/ProductDetailPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "products", component: ProductsListPage },
    { path: "/products/:id", name: "product", component: ProductDetailPage },
  ],
});
