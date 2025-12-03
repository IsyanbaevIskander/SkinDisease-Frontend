<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <span class="gradient-text">SkinAI</span>
      </div>

      <h1>Добро пожаловать</h1>
      <p class="subtitle">Войдите в свой аккаунт</p>

      <form @submit.prevent="loginUser" class="login-form">
        <div class="input-group">
          <label>Имя пользователя</label>
          <input
              v-model="username"
              type="text"
              placeholder="Введите имя пользователя"
              required
              autocomplete="username"
          />
        </div>

        <div class="input-group">
          <label>Пароль</label>
          <input
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              required
              autocomplete="current-password"
          />
        </div>

        <button
            type="submit"
            class="btn-primary"
            :disabled="!canSubmit || loading"
        >
          <span v-if="loading">Вход...</span>
          <span v-else>Войти в систему</span>
        </button>
      </form>

      <div class="footer">
        <p>
          Нет аккаунта?
          <router-link to="/register" class="link">Зарегистрироваться</router-link>
        </p>
      </div>

      <!-- Ошибка -->
      <div v-if="error" class="error-message">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { api } from "../api/axios";
import { useAuthStore } from "../api/auth";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const store = useAuthStore();
const router = useRouter();

const canSubmit = computed(() => {
  return username.value.trim().length >= 3 && password.value.length >= 6;
});

async function loginUser() {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await api.post("token/", {
      username: username.value.trim(),
      password: password.value,
    });

    const { access, refresh, role, id } = response.data;

    store.setTokens({
      access,
      refresh,
      role,
      username: username.value.trim(),
      id,
    });

    // Успешный вход
    if (role === "patient") {
      router.push("/patient-requests");
    } else if (role === "dermatologist") {
      router.push("/doctor-requests");
    } else {
      router.push("/patient-requests"); // fallback
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err.response?.status === 401) {
      error.value = "Неверное имя пользователя или пароль";
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else {
      error.value = "Ошибка подключения. Попробуйте позже.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: "Inter", system-ui, sans-serif;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logo {
  margin-bottom: 1.5rem;
}
.gradient-text {
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  margin-bottom: 1.5rem;
}

.input-group {
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
}

.input-group input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #ffffff;
}

.input-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.btn-primary {
  background: #6366f1;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  margin-top: 0.8rem;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.footer {
  margin-top: 1.8rem;
  color: #64748b;
  font-size: 0.95rem;
}

.link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  justify-content: center;
}

.error-message .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>