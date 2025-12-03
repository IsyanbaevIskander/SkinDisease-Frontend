<template>
  <div class="page">
    <nav class="navbar">
      <div class="logo">
        <span class="gradient-text">SkinAI</span>
        <span class="role-badge">Доктор</span>
      </div>
      <div class="nav-links">
        <router-link to="/doctor-requests" class="nav-link">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Все запросы
        </router-link>
        <a href="#" @click.prevent="profileVisible = true" class="nav-link">Профиль</a>
        <a href="#" @click.prevent="logout" class="nav-link">Выйти</a>
      </div>
    </nav>

    <teleport to="body">
      <ProfileModal v-model:visible="profileVisible" />
    </teleport>

    <main class="container">
      <!-- Загрузка -->
      <div v-if="loading" class="loading-state">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
        </svg>
        <p>Загрузка запроса...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="error-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Ошибка</h3>
        <p>{{ error }}</p>
      </div>

      <!-- Контент -->
      <div v-else>
        <header class="page-header">
          <h1>Запрос №{{ request.id }}</h1>
          <p class="date">{{ formatDate(request.created_at) }}</p>
        </header>

        <!-- Фото 500×500 -->
        <div class="image-card" v-if="request.image">
          <div class="image-wrapper">
            <img :src="request.image" alt="Фото кожи" class="skin-image" />
          </div>
        </div>

        <!-- Результат ИИ -->
        <div class="result-card">
          <h2 class="section-title">Результат анализа ИИ</h2>

          <div class="info-row">
            <span class="label">Предсказанное заболевание:</span>
            <span class="value highlight">
              {{ request.result?.condition?.name || "Не определено" }}
            </span>
          </div>

          <div class="info-row" v-if="request.result?.confidence != null">
            <span class="label">Уверенность модели:</span>
            <span class="value confidence">
              {{ Number(request.result.confidence).toFixed(1) }}%
              <span class="confidence-bar">
                <div
                    class="fill"
                    :style="{ width: request.result.confidence + '%' }"
                    :class="confidenceClass"
                ></div>
              </span>
            </span>
          </div>
        </div>

        <!-- Верификация -->
        <div class="verification-card">
          <h2 class="section-title">Верификация диагноза</h2>

          <!-- Уже верифицировано -->
          <div v-if="request.result?.verification" class="verification verified">
            <svg class="icon verified-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div class="verification-text">
              <strong>Диагноз подтверждён</strong>
              <div class="doctor">Врач: {{ request.result.verification.doctor_name }}</div>
              <div class="actual">Фактическое заболевание: <strong>{{ request.result.verification.actual_condition_detail.name }}</strong></div>
            </div>
          </div>

          <!-- Форма верификации -->
          <div v-else class="verification-form">
            <p class="hint">Выберите правильный диагноз:</p>
            <select v-model="selectedConditionId" class="condition-select">
              <option :value="null" disabled>— Выберите заболевание —</option>
              <option v-for="cond in conditions" :key="cond.id" :value="cond.id">
                {{ cond.name }}
              </option>
            </select>
            <button
                class="btn-primary"
                @click="saveVerification"
                :disabled="!selectedConditionId || saving"
            >
              <span v-if="saving">Сохранение...</span>
              <span v-else>Подтвердить диагноз</span>
            </button>
          </div>
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
import ProfileModal from "./ProfileModal.vue";

const route = useRoute();
const router = useRouter();
const store = useAuthStore();

const request = ref(null);
const conditions = ref([]);
const selectedConditionId = ref(null);
const loading = ref(true);
const error = ref("");
const saving = ref(false);
const profileVisible = ref(false);

async function fetchData() {
  loading.value = true;
  error.value = "";

  try {
    const [condRes, reqRes] = await Promise.all([
      api.get("skin_conditions/"),
      api.get(`diagnosis_requests/${route.params.id}/`)
    ]);

    conditions.value = condRes.data;

    let imageUrl = null;
    if (reqRes.data.image) {
      imageUrl = reqRes.data.image.startsWith("http")
          ? reqRes.data.image
          : `http://localhost:8000${reqRes.data.image.startsWith("/") ? "" : "/"}${reqRes.data.image}`;
    }

    request.value = { ...reqRes.data, image: imageUrl };
  } catch (err) {
    console.error(err);
    if (err.response?.status === 401) {
      error.value = "Сессия истекла. Войдите заново.";
      setTimeout(() => store.logout(), 2000);
    } else {
      error.value = "Не удалось загрузить данные.";
    }
  } finally {
    loading.value = false;
  }
}

async function saveVerification() {
  if (!selectedConditionId.value) return;
  saving.value = true;

  try {
    await api.post("medical_verifications/", {
      result: request.value.result.id,
      doctor: store.userId,
      actual_condition: selectedConditionId.value,
    });
    alert("Верификация сохранена!");
    selectedConditionId.value = null;
    await fetchData();
  } catch (err) {
    alert("Ошибка при сохранении");
  } finally {
    saving.value = false;
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

// Цвет полоски уверенности (теперь значение уже в %)
const confidenceClass = computed(() => {
  const c = request.value?.result?.confidence || 0;
  if (c >= 80) return "high";
  if (c >= 50) return "medium";
  return "low";
});

onMounted(fetchData);
</script>

<style scoped>
.page { min-height: 100vh; background: linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%); font-family: "Inter", system-ui, sans-serif; color: #1e293b; }
.navbar { background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.06); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; }
.logo { font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 12px; }
.gradient-text { background: linear-gradient(90deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.role-badge { font-size: 0.8rem; background: #e0e7ff; color: #6366f1; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-link { color: #475569; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
.nav-link:hover { color: #6366f1; }
.back-icon { width: 20px; height: 20px; }
.container { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
.page-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0 0 0.5rem; }
.date { color: #64748b; font-size: 1.1rem; }

/* Фото 500×500 */
.image-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 2rem; }
.image-wrapper { width: 500px; height: 500px; margin: 0 auto; border-radius: 16px; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 32px rgba(0,0,0,0.15); }
.skin-image { max-width: 100%; max-height: 100%; object-fit: contain; }

.result-card, .verification-card { background: rgba(255,255,255,0.9); backdrop-filter:rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 2rem; }
.section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1e293b; }

.info-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #e2e8f0; }
.info-row:last-of-type { border-bottom: none; }
.label { color: #64748b; font-weight: 600; }
.value { font-weight: 600; font-size: 1.1rem; }
.highlight { color: #6366f1; }

.confidence { display: flex; align-items: center; gap: 12px; font-size: 1.3rem; font-weight: 700; }
.confidence-bar { width: 200px; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
.fill { height: 100%; border-radius: 6px; transition: width 1s ease; }
.fill.high { background: #10b981; }
.fill.medium { background: #f59e0b; }
.fill.low { background: #ef4444; }

/* Маленькая галочка */
.verification.verified { display: flex; align-items: flex-start; gap: 1rem; padding: 1.2rem; border-radius: 12px; background: #ecfdf5; border: 1px solid #10b98133; }
.verified-icon { width: 24px; height: 24px; flex-shrink: 0; color: #10b981; margin-top: 0.15rem; }
.verification-text strong { color: #065f46; font-size: 1.05rem; }
.verification-text .doctor { color: #64748b; font-size: 0.92rem; margin-top: 0.25rem; }
.verification-text .actual { margin-top: 0.5rem; color: #10b981; font-weight: 600; }

.verification-form { margin-top: 0.5rem; }
.hint { color: #64748b; margin-bottom: 1rem; }
.condition-select { width: 100%; padding: 0.9rem 1rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem; background: white; }
.condition-select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

.btn-primary { background: #6366f1; color: white; padding: 0.9rem 2rem; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.loading-state, .error-state { text-align: center; padding: 5rem 1rem; color: #64748b; }
.spinner { width: 60px; height: 60px; margin: 0 auto 1rem; animation: spin 1.6s linear infinite; }
.spinner circle { stroke-dasharray: 125; animation: dash 1.6s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes dash { 0% { stroke-dashoffset: 125; } 50% { stroke-dashoffset: 30; } 100% { stroke-dashoffset: 125; } }
</style>