<script setup>
import { ref, onMounted } from "vue";
import { api } from "../api/axios";
import { useAuthStore } from "../api/auth";

const store = useAuthStore();
const requests = ref([]);

onMounted(async () => {
  let url = "diagnosis_requests/";

  if (store.role === "patient") {
    url += `?user=${store.userId}`;
  }

  if (store.role === "dermatologist") {
    url += `?responsible=${store.userId}`;
  }

  const { data } = await api.get(url);
  requests.value = data;
});
</script>


<template>
  <div class="container">
    <h2 v-if="store.role === 'patient'">Мои запросы</h2>
    <h2 v-else>Назначенные мне запросы</h2>

    <div v-if="requests.length === 0" class="card">
      <p>Пока нет запросов</p>
    </div>

    <div
        v-for="item in requests"
        :key="item.id"
        class="card"
    >
      <p><b>ID запроса:</b> {{ item.id }}</p>
      <p>{{ item.created_at }}</p>
    </div>
  </div>
</template>
