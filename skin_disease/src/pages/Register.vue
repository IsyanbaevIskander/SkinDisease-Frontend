<template>
  <div class="register-page">
    <div class="register-card">
      <div class="logo">
        <span class="gradient-text">SkinAI</span>
      </div>

      <h1>Создать аккаунт</h1>
      <p class="subtitle">Заполните форму для регистрации</p>

      <form @submit.prevent="registerUser" class="register-form">
        <div class="input-group">
          <label>Имя пользователя *</label>
          <input
              v-model="username"
              type="text"
              placeholder="Придумайте логин"
              required
              autocomplete="username"
          />
        </div>

        <div class="input-group">
          <label>Имя *</label>
          <input
              v-model="firstName"
              type="text"
              placeholder="Иван"
              required
              autocomplete="given-name"
          />
        </div>

        <div class="input-group">
          <label>Фамилия *</label>
          <input
              v-model="lastName"
              type="text"
              placeholder="Иванов"
              required
              autocomplete="family-name"
          />
        </div>

        <div class="input-group">
          <label>Роль *</label>
          <select v-model="role" class="select-role">
            <option value="patient">Пациент</option>
            <option value="dermatologist">Дерматолог</option>
          </select>
        </div>

        <div class="input-group">
          <label>Пароль *</label>
          <input
              v-model="password"
              type="password"
              placeholder="Минимум 6 символов"
              required
              autocomplete="new-password"
          />
        </div>

        <div class="input-group">
          <label>Повторите пароль *</label>
          <input
              v-model="password2"
              type="password"
              placeholder="Повторите пароль"
              required
              autocomplete="new-password"
          />
        </div>

        <!-- Сообщение о пароле -->
        <div class="password-status" :class="passwordStatusClass">
          <svg v-if="passwordMessage" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path v-if="passwordsMatch && passwordValid" fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
            <path v-else fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd" />
          </svg>
          <span>{{ passwordMessage }}</span>
        </div>

        <button
            type="submit"
            class="btn-primary"
            :disabled="!canSubmit || loading"
        >
          <span v-if="loading">Создание аккаунта...</span>
          <span v-else>Зарегистрироваться</span>
        </button>
      </form>

      <!-- Успешно — предлагаем войти -->
      <div v-if="success" class="success-message">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <strong>Аккаунт успешно создан!</strong>
          <p>Теперь вы можете <router-link to="/login" class="link">войти в систему</router-link></p>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-if="error" class="error-message">
        <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div class="footer">
        Уже есть аккаунт?
        <router-link to="/login" class="link">Войти</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { api } from "../api/axios";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const firstName = ref("");
const lastName = ref("");
const role = ref("patient");
const password = ref("");
const password2 = ref("");

const loading = ref(false);
const error = ref("");
const success = ref(false);

const passwordValid = computed(() => password.value.length >= 6);
const passwordsMatch = computed(() => password.value === password2.value && password.value !== "");

const passwordMessage = computed(() => {
  if (!password.value && !password2.value) return "";
  if (!passwordValid.value) return "Пароль должен быть не менее 6 символов";
  if (!passwordsMatch.value) return "Пароли не совпадают";
  return "Пароли совпадают";
});

const passwordStatusClass = computed(() => {
  if (passwordsMatch.value && passwordValid.value) return "success";
  if (password.value || password2.value) return "error";
  return "";
});

const canSubmit = computed(() => {
  return (
      username.value.trim() &&
      firstName.value.trim() &&
      lastName.value.trim() &&
      passwordValid.value &&
      passwordsMatch.value
  );
});

async function registerUser() {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    await api.post("users/", {
      username: username.value.trim(),
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      role: role.value,
      password: password.value,
    });

    success.value = true;
    // Очищаем форму
    username.value = firstName.value = lastName.value = password.value = password2.value = "";
    role.value = "patient";
  } catch (err) {
    console.error(err);
    if (err.response?.data) {
      const data = err.response.data;
      if (data.username) error.value = "Это имя пользователя уже занято";
      else if (data.detail) error.value = data.detail;
      else error.value = "Ошибка регистрации. Попробуйте позже.";
    } else {
      error.value = "Нет соединения с сервером";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: "Inter", system-ui, sans-serif;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 460px;
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

.register-form {
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

.input-group input,
.select-role {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

.input-group input:focus,
.select-role:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.select-role {
  cursor: pointer;
}

.password-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.password-status.success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #86efac66;
}

.password-status.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a566;
}

.password-status .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
  margin-top: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  margin-top: 1.5rem;
  padding: 1.2rem;
  background: #ecfdf5;
  border: 1px solid #86efac66;
  border-radius: 12px;
  color: #059669;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.success-message .icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
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
}

.error-message .icon,
.success-message .icon {
  flex-shrink: 0;
}

.footer {
  margin-top: 2rem;
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
</style>