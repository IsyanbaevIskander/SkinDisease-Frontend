<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-backdrop" @click.self="close">
      <div class="modal-content" @click.stop>
        <!-- Крестик закрытия — теперь SVG, виден везде -->
        <button class="close-btn" @click="close" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div class="modal-header">
          <h2>Профиль</h2>
          <p class="subtitle">Редактирование личных данных</p>
        </div>

        <form @submit.prevent="save" class="profile-form">
          <div class="field">
            <label>Имя пользователя</label>
            <input v-model="form.username" type="text" required />
          </div>

          <div class="field">
            <label>Имя</label>
            <input v-model="form.first_name" type="text" />
          </div>

          <div class="field">
            <label>Фамилия</label>
            <input v-model="form.last_name" type="text" />
          </div>

          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving">Сохранение...</span>
              <span v-else>Сохранить</span>
            </button>
            <button type="button" class="btn-secondary" @click="close">
              Отмена
            </button>
          </div>
        </form>

        <div v-if="error" class="error-msg">{{ error }}</div>
        <div v-if="success" class="success-msg">Изменения сохранены!</div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from "vue";
import { api } from "../api/axios";
import { useAuthStore } from "../api/auth";

const props = defineProps({ visible: Boolean });
const emit = defineEmits(["update:visible"]);
const store = useAuthStore();

const form = ref({
  username: "",
  first_name: "",
  last_name: "",
});

const saving = ref(false);
const error = ref("");
const success = ref(false);

function close() {
  emit("update:visible", false);
  error.value = "";
  success.value = false;
}

async function loadProfile() {
  try {
    const { data } = await api.get(`users/${store.userId}/`);
    form.value = {
      username: data.username || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
    };
  } catch (err) {
    error.value = "Не удалось загрузить данные профиля";
  }
}

async function save() {
  error.value = "";
  success.value = false;
  saving.value = true;

  try {
    // PATCH может возвращать 200 или 204 — оба варианта считаем успехом
    await api.patch(`users/${store.userId}/`, form.value);

    // Обновляем данные в сторе только если метод существует
    if (typeof store.fetchUser === "function") {
      await store.fetchUser().catch(() => {}); // игнорируем ошибку, если fetchUser тоже 204
    } else if (store.user) {
      // если в сторе просто объект user — обновляем его вручную
      Object.assign(store.user, form.value);
    }

    success.value = true;
    setTimeout(close, 1200);
  } catch (err) {
    // Настоящая ошибка — только если есть response с ошибкой
    if (err.response?.data) {
      const msg = Object.values(err.response.data).flat().join(" ");
      error.value = msg || "Ошибка сохранения";
    } else {
      error.value = "Нет соединения с сервером";
    }
  } finally {
    saving.value = false;
  }
}

watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadProfile();
        success.value = false;
        error.value = "";
      }
    }
);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 460px;
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.close-btn:hover {
  color: #64748b;
  background: #f1f5f9;
}

.modal-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
  font-weight: 700;
}
.subtitle {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.profile-form .field {
  margin-bottom: 1.5rem;
}
.profile-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}
.profile-form input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
}
.profile-form input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.8rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn-primary {
  background: #6366f1;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.error-msg {
  margin-top: 1rem;
  color: #ef4444;
  text-align: center;
}
.success-msg {
  margin-top: 1rem;
  color: #10b981;
  text-align: center;
  font-weight: 600;
}

/* Анимация */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.92); }
</style>