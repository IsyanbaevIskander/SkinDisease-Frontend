<template>
  <div class="page">
    <!-- Навбар -->
    <nav class="navbar">
      <div class="logo">
        <span class="gradient-text">SkinAI</span>
      </div>
      <div class="nav-links">
        <router-link to="/patient-requests" class="nav-link">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Назад к запросам
        </router-link>
        <a href="#" @click.prevent="logout" class="nav-link">Выйти</a>
      </div>
    </nav>

    <main class="container">
      <header class="page-header">
        <h1>Запрос №{{ request.id }}</h1>
        <p class="date">{{ formatDate(request.created_at) }}</p>
      </header>

      <!-- Фото -->
      <div class="image-card" v-if="request.image">
        <img :src="request.image" alt="Фото проблемного участка" class="skin-image" />
      </div>

      <!-- Результат анализа -->
      <div class="result-card">
        <h2 class="section-title">
          <svg class="title-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064  7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
          </svg>
          Результат анализа ИИ
        </h2>

        <!-- Есть результат -->
        <div v-if="request.result" class="result-content">
          <!-- Заболевание -->
          <div class="info-row">
            <span class="label">Заболевание:</span>
            <span class="value highlight">
              {{ request.result.condition?.name || "Не определено" }}
            </span>
          </div>

          <!-- Уверенность -->
          <div class="info-row" v-if="request.result.confidence">
            <span class="label">Уверенность модели:</span>
            <span class="value confidence">
              {{ parseFloat(request.result.confidence).toFixed(1) }}%
              <span class="confidence-bar">
                <div
                    class="fill"
                    :style="{ width: (request.result.confidence) + '%' }"
                    :class="confidenceClass"
                ></div>
              </span>
            </span>
          </div>

          <!-- Верификация -->
          <div v-if="request.result.verification" class="verification verified">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div>
              <div><strong>Подтверждено врачом</strong></div>
              <div class="doctor">Дерматолог: {{ request.result.verification.doctor_name }}</div>
              <div class="actual">Фактический диагноз: <strong>{{ request.result.verification.actual_condition_detail.name }}</strong></div>
            </div>
          </div>

          <div v-else class="verification pending">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            <div>
              <strong>Ожидает проверки врачом</strong>
              <div class="hint">Дерматолог проверит результат в ближайшее время</div>
            </div>
          </div>
        </div>

        <!-- Результат ещё не готов -->
        <div v-else class="result-content waiting">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
          </svg>
          <p><strong>Идёт анализ изображения...</strong></p>
          <p class="hint">Это может занять до 2 минут. Пожалуйста, подождите.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/axios";
import { useAuthStore } from "../api/auth";

const route = useRoute();
const router = useRouter();
const store = useAuthStore();

const request = ref({});

async function loadRequest() {
  try {
    const { data } = await api.get(`diagnosis_requests/${route.params.id}/`);
    request.value = data;
  } catch (err) {
    console.error("Ошибка загрузки запроса:", err);
  }
}

function logout() {
  store.logout();
  router.push("/login");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Определяем цвет полоски уверенности
const confidenceClass = computed(() => {
  const conf = request.value.result?.confidence || 0;
  const percent = conf;
  if (percent >= 80) return "high";
  if (percent >= 50) return "medium";
  return "low";
});

onMounted(loadRequest);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%);
  font-family: "Inter", system-ui, sans-serif;
  color: #1e293b;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo { font-size: 1.8rem; font-weight: 800; }
.gradient-text {
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-link {
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
}
.nav-link:hover { color: #6366f1; }
.back-icon { width: 20px; height: 20px; }

.container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }

.page-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0 0 0.5rem; }
.date { color: #64748b; font-size: 1.1rem; }

.image-card {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}
.skin-image {
  max-width: 100%;
  max-height: 520px;
  border-radius: 16px;
  object-fit: contain;
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.result-card {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  color: #1e293b;
}
.title-icon { width: 28px; height: 28px; color: #6366f1; }

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
}
.info-row:last-of-type { border-bottom: none; }

.label { color: #64748b; font-weight: 600; }
.value { font-weight: 600; font-size: 1.1rem; }
.highlight { color: #6366f1; }

.confidence {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.3rem;
  font-weight: 700;
}
.confidence-bar {
  width: 200px;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1.2s ease;
}
.fill.high { background: #10b981; }
.fill.medium { background: #f59e0b; }
.fill.low { background: #ef4444; }

.verification {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  font-size: 1.05rem;
}
.verification.verified {
  background: #ecfdf5;
  border: 1px solid #10b98133;
}
.verification.pending {
  background: #fffbeb;
  border: 1px solid #f59e0b33;
}
.verification .icon { width: 32px; height: 32px; flex-shrink: 0; margin-top: 0.2rem; color: #10b981; }
.verification.pending .icon { color: #f59e0b; }
.verification .doctor { color: #64748b; font-size: 0.95rem; }
.verification .actual { margin-top: 0.4rem; color: #10b981; font-weight: 600; }

.waiting {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}
.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  animation: spin 1.6s linear infinite;
}
.spinner circle {
  stroke-dasharray: 125;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash 1.6s ease-in-out infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes dash { 0% { stroke-dashoffset: 125; } 50% { stroke-dashoffset: 30; } 100% { stroke-dashoffset: 125; } }

.hint { margin-top: 0.8rem; font-size: 0.95rem; }
</style>