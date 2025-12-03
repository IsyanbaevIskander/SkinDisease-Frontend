<template>
  <Navbar />
  <div class="container">
    <h2>Новый запрос</h2>
    <form @submit.prevent="send">
      <input type="file" @change="chooseFile" />
      <button class="btn">Отправить</button>
    </form>
  </div>
</template>


<script setup>
import { ref } from "vue";
import { createRequest } from "../api/diagnosis";
import { useRouter } from "vue-router";
import { useAuthStore } from "../api/auth";

const file = ref(null);
const router = useRouter();


router.beforeEach((to) => {
  const store = useAuthStore();
  if (to.meta.auth && !store.access) {
    return "/login";
  }
});

function chooseFile(event) {
  file.value = event.target.files[0];
}

async function send() {
  await createRequest(file.value);
  router.push("/requests");
}
</script>
