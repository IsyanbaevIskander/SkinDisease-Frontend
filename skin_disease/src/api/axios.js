import axios from "axios";
import { useAuthStore } from "./auth";

export const api = axios.create({
    baseURL: "http://localhost:8000/backend/",
    headers: { "Content-Type": "application/json" }
});

// Добавляем access-токен в каждый запрос
api.interceptors.request.use((config) => {
    const store = useAuthStore();

    if (store.access) {
        config.headers.Authorization = `Bearer ${store.access}`;
    }

    return config;
});

// Обработка 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const store = useAuthStore();

        if (error.response?.status === 401 && store.refresh) {
            try {
                const refreshResponse = await axios.post(
                    "http://localhost:8000/backend/token/refresh/",
                    { refresh: store.refresh }
                );

                store.access = refreshResponse.data.access;
                localStorage.setItem("access", store.access);

                error.config.headers.Authorization = `Bearer ${store.access}`;
                return api.request(error.config);
            } catch {
                // refresh не сработал — logout
            }
        }

        store.logout();

        // 🔥 динамический импорт, чтобы избежать циклических зависимостей
        const { router } = await import("../router");
        router.push("/login");

        return Promise.reject(error);
    }
);
api.interceptors.request.use((config) => {
    // Если в запросе FormData — УДАЛЯЕМ Content-Type, пусть браузер сам поставит с boundary
    if (config.data instanceof FormData) {
        config.headers["Content-Type"] = undefined;
        // Или можно явно: delete config.headers["Content-Type"];
    }
    return config;
});
export default api;