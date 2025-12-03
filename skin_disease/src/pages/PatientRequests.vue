<template>
  <div class="page">
    <nav class="navbar">
      <div class="logo"><span class="gradient-text">SkinAI</span></div>
      <div class="nav-links">
        <router-link to="/patient-requests" class="nav-link active">Запросы</router-link>
        <a href="#" @click.prevent="openModal" class="nav-link primary">+ Новый запрос</a>
        <a href="#" @click.prevent="profileVisible = true" class="nav-link">Профиль</a>
        <a href="#" @click.prevent="logout" class="nav-link">Выйти</a>
      </div>
    </nav>

    <teleport to="body">
      <ProfileModal v-model:visible="profileVisible" />
    </teleport>

    <main class="container">
      <header class="page-header">
        <h1>Мои запросы</h1>
        <p class="subtitle">Отслеживайте статус анализа ваших изображений</p>
      </header>

      <!-- Пустое состояние -->
      <div v-if="requests.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <circle cx="9" cy="9" r="1"/>
          <circle cx="15" cy="9" r="1"/>
        </svg>
        <h3>Пока нет запросов</h3>
        <p>Загрузите первое изображение, чтобы начать диагностику</p>
        <button @click="openModal" class="btn-primary large">+ Создать новый запрос</button>
      </div>

      <!-- Список запросов -->
      <div class="requests-grid">
        <div v-for="req in requests" :key="req.id" class="request-card" @click="goToRequest(req.id)">
          <div class="card-header">
            <span class="request-id">#{{ req.id }}</span>
            <span class="date">{{ formatDate(req.created_at) }}</span>
          </div>

          <div class="status-badge" :class="statusClass(req)">
            <!-- SVG-иконки вместо эмодзи -->
            <svg v-if="req.result?.verification" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="req.result" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l7.778 7.778-1.414 1.414zM6.523 13.477l7.778-7.778a6 6 0 10-8.485 8.485l1.414-1.414z" clip-rule="evenodd"/>
            </svg>
            <span>{{ statusText(req) }}</span>
          </div>

          <!-- Стрелка вправо -->
          <svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </main>

    <!-- Модалка -->
    <teleport to="body">
      <Transition name="modal">
        <div v-if="modalVisible" class="modal-backdrop" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="close-btn" @click="closeModal">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>

            <h2>Новый запрос на диагностику</h2>
            <p class="modal-desc">Загрузите фото проблемного участка кожи</p>

            <div class="upload-area" :class="{ dragover: dragOver }"
                 @drop.prevent="onDrop" @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false">
              <input type="file" @change="handleFileUpload" accept="image/*" id="file-input"/>
              <label for="file-input" class="upload-label">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p v-if="!selectedFile">Перетащите изображение или нажмите для выбора</p>
                <p v-else class="filename">{{ selectedFile.name }}</p>
              </label>
            </div>

            <div class="modal-actions">
              <button class="btn-primary" @click="createRequest" :disabled="loading || !selectedFile">
                <span v-if="loading">Загрузка...</span>
                <span v-else>Отправить на анализ</span>
              </button>
              <button class="btn-secondary" @click="closeModal">Отмена</button>
            </div>
            <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          </div>
        </div>
      </Transition>
    </teleport>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { api } from "../api/axios";
import { useAuthStore } from "../api/auth";
import { useRouter } from "vue-router";
import ProfileModal from "./ProfileModal.vue";

const router = useRouter();
const store = useAuthStore();

const requests = ref([]);
const profileVisible = ref(false);
const modalVisible = ref(false);
const selectedFile = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const dragOver = ref(false);

function logout() {
  store.logout();
  router.push("/login");
}

function goToRequest(id) {
  router.push(`/request/${id}`);
}

function openModal() {
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  selectedFile.value = null;
  errorMessage.value = "";
  dragOver.value = false;
}

function onDrop(e) {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) selectedFile.value = file;
  dragOver.value = false;
}

function handleFileUpload(e) {
  if (e.target.files[0]) selectedFile.value = e.target.files[0];
}

async function createRequest() {
  if (!selectedFile.value) {
    errorMessage.value = "Пожалуйста, выберите изображение";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const formData = new FormData();
  formData.append("image", selectedFile.value, selectedFile.value.name);
  formData.append("user", Number(store.userId));

  try {
    const { data } = await api.post("diagnosis_requests/", formData, {
      headers: { "Content-Type": undefined },
    });
    closeModal();
    router.push(`/request/${data.id}`);
  } catch (err) {
    console.error(err.response?.data);
    errorMessage.value = err.response?.data?.image?.[0] || "Ошибка загрузки. Попробуйте другое изображение.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get("diagnosis_requests/");
    requests.value = data;
  } catch {
    requests.value = [];
  }
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(req) {
  if (req.result?.verification) return "verified";
  if (req.result) return "pending";
  return "waiting";
}

function statusText(req) {
  if (req.result?.verification) return "Диагноз подтверждён врачом";
  if (req.result) return "Ожидает проверки врачом";
  return "Идёт анализ изображения";
}
</script>

<style scoped>
:root {
  --primary: #6366f1;
  --success: #10b981;
  --warning: #f59e0b;
  --radius: 16px;
  --shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%);
  font-family: "Inter", system-ui, sans-serif;
  color: #1e293b;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.navbar {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo { font-size: 1.8rem; font-weight: 800; }
.gradient-text {
  background: linear-gradient(90deg, var(--primary), #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-link { color: #475569; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.nav-link:hover { color: var(--primary); }
.nav-link.primary { background: var(--primary); color: white; padding: 0.65rem 1.2rem; border-radius: 12px; }
.nav-link.primary:hover { background: #4f46e5; }
.nav-link.active { color: var(--primary); font-weight: 600; }

.page-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0 0 0.5rem; }
.subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 3rem; }

.empty-state { text-align: center; padding: 5rem 2rem; color: #64748b; }
.empty-icon { font-size: 4.5rem; margin-bottom: 1rem; }
.empty-state h3 { font-size: 1.6rem; margin: 1rem 0; }
.btn-primary.large { margin-top: 2rem; padding: 1rem 2.2rem; font-size: 1.1rem; }

.requests-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.request-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: var(--radius);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.request-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), #c084fc);
  opacity: 0;
  transition: opacity 0.3s;
}

.request-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}

.request-card:hover::before { opacity: 1; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.request-id { font-size: 1.1rem; font-weight: 700; }
.date { color: #94a3b8; font-size: 0.9rem; }

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 50px;
  font-size: 0.95rem;
}

.status-badge.verified { background: #d1fae5; color: var(--success); }
.status-badge.pending { background: #fef3c7; color: var(--warning); }
.status-badge.waiting { background: #e0e7ff; color: var(--primary); }

.card-arrow {
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  opacity: 0.3;
  transition: all 0.3s;
}

.request-card:hover .card-arrow {
  opacity: 1;
  right: 1rem;
  transform: translateY(-50%) translateX(6px);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 480px;
  border-radius: var(--radius);
  padding: 2rem;
  position: relative;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
}

.close-btn {
  position: absolute;
  top: 1rem; right: 1rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #94a3b8;
}

.modal-content h2 { margin: 0 0 0.5rem; font-size: 1.8rem; }
.modal-desc { color: #64748b; margin-bottom: 2rem; }

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius);
  padding: 3rem 1rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  background: #f8fafc;
}

.upload-area.dragover {
  border-color: var(--primary);
  background: #eef2ff;
}

.upload-area input { display: none; }
.upload-icon { font-size: 3.5rem; margin-bottom: 1rem; }
.filename { color: var(--primary); font-weight: 600; }

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #e2e8f0; color: #475569; }

.error-msg { margin-top: 1rem; color: #ef4444; text-align: center; }

.modal-enter-active, .modal-leave-active { transition: all 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.9); }
.icon { width: 18px; height: 18px; margin-right: 8px; flex-shrink: 0; }
.card-arrow { width: 28px; height: 28px; position: absolute; right: 1.2rem; top: 50%; transform: translateY(-50%); opacity: 0.3; transition: all 0.3s; }
.request-card:hover .card-arrow { opacity: 1; transform: translateY(-50%) translateX(6px); }
.empty-icon, .upload-icon { width: 72px; height: 72px; color: #94a3b8; margin: 0 auto 1rem; }

/* Остальные стили — точно как у тебя были (оставь их без изменений) */
:root { --primary: #6366f1; --success: #10b981; --warning: #f59e0b; --radius: 16px; --shadow: 0 10px 30px rgba(0,0,0,0.08); }
.page { min-height: 100vh; background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%); font-family: "Inter", system-ui, sans-serif; color: #1e293b; }
</style>