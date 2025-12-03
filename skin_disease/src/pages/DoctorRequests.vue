<template>
  <div class="page">
    <!-- Навбар -->
    <nav class="navbar">
      <div class="logo">
        <span class="gradient-text">SkinAI</span>
        <span class="role-badge">Доктор</span>
      </div>
      <div class="nav-links">
        <router-link to="/doctor-requests" class="nav-link active">
          Все запросы
        </router-link>
        <a href="#" @click.prevent="profileVisible = true" class="nav-link">Профиль</a>
        <a href="#" @click.prevent="logout" class="nav-link">Выйти</a>
      </div>
    </nav>

    <!-- Профиль модалка -->
    <teleport to="body">
      <ProfileModal v-model:visible="profileVisible" />
    </teleport>

    <main class="container">
      <header class="page-header">
        <h1>Запросы на верификацию</h1>
        <p class="subtitle">Подтверждайте или корректируйте диагнозы ИИ</p>
      </header>

      <!-- Пустое состояние -->
      <div v-if="requests.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6-4h6m-6 8h6"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <h3>Нет запросов на проверку</h3>
        <p>Новые запросы появятся здесь, когда ИИ закончит анализ</p>
      </div>

      <!-- Список запросов -->
      <div class="requests-grid">
        <div
            v-for="req in requests"
            :key="req.id"
            class="request-card"
            @click="goToRequest(req.id)"
        >
          <div class="card-header">
            <span class="request-id">#{{ req.id }}</span>
            <span class="date">{{ formatDate(req.created_at) }}</span>
          </div>

          <div class="patient-info">
            <strong>{{ req.user_name || 'Пациент' }}</strong>
          </div>

          <!-- Статус с SVG-иконками -->
          <div class="status-badge" :class="statusClass(req)">
            <svg v-if="req.result?.verification" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="req.result" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-4.464a1 1 0 10-1.414-1.414l-1.122 1.122-1.122-1.122a1 1 0 00-1.414 1.414l1.122 1.122-1.122 1.122a1 1 0 101.414 1.414l1.122-1.122 1.122 1.122a1 1 0 001.414-1.414l-1.122-1.122 1.122-1.122z" clip-rule="evenodd"/>
            </svg>
            <span>{{ statusText(req) }}</span>
          </div>

          <!-- Стрелка -->
          <svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </main>
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

function logout() {
  store.logout();
  router.push("/login");
}

function goToRequest(id) {
  router.push(`/doctor-request/${id}`);
}

onMounted(async () => {
  try {
    const { data } = await api.get("diagnosis_requests/");
    requests.value = data;
  } catch (err) {
    console.error("Ошибка загрузки запросов:", err);
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
  if (req.result?.verification) return "Диагноз подтверждён";
  if (req.result) return "Ожидает вашей проверки";
  return "Анализ ИИ в процессе";
}
</script>

<style scoped>
/* Тот же премиум стиль, что и у пациента — 100% совпадает */
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

.logo { font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 12px; }
.gradient-text {
  background: linear-gradient(90deg, var(--primary), #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.role-badge {
  font-size: 0.8rem;
  background: #e0e7ff;
  color: var(--primary);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-link { color: #475569; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.nav-link:hover { color: var(--primary); }
.nav-link.active { color: var(--primary); font-weight: 600; }

.page-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0 0 0.5rem; }
.subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 3rem; }

.empty-state { text-align: center; padding: 5rem 2rem; color: #64748b; }
.empty-icon { width: 80px; height: 80px; margin-bottom: 1rem; color: #94a3b8; }

.requests-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.request-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius刑: var(--radius);
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
  margin-bottom: 0.8rem;
}

.request-id { font-size: 1.1rem; font-weight: 700; }
.date { color: #94a3b8; font-size: 0.9rem; }

.patient-info {
  margin-bottom: 1rem;
  color: #475569;
  font-size: 1.05rem;
}

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

.icon { width: 18px; height: 18px; flex-shrink: 0; }

.card-arrow {
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  opacity: 0.3;
  transition: all 0.3s;
}

.request-card:hover .card-arrow {
  opacity: 1;
  transform: translateY(-50%) translateX(6px);
}
</style>