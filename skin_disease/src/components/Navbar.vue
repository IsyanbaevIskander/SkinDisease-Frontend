<script setup>
import { useUserStore } from "../store/user";
const store = useUserStore();

function logout() {
  store.logout();
  window.location.href = "/login";
}
</script>

<template>
  <nav class="card" style="display:flex; justify-content:space-between;">
    <strong>SkinAI</strong>

    <div>
      <!-- Пациент -->
      <router-link v-if="store.role === 'patient'" class="btn" to="/requests">
        Мои запросы
      </router-link>

      <router-link v-if="store.role === 'patient'" class="btn" to="/new">
        Новый запрос
      </router-link>

      <!-- Дерматолог -->
      <router-link v-if="store.role === 'dermatologist'" class="btn" to="/doctor">
        Верификация
      </router-link>

      <router-link class="btn" to="/profile">Профиль</router-link>
      <button class="btn" @click="logout">Выйти</button>
    </div>
  </nav>
</template>
