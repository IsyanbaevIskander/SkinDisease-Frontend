import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import PatientRequests from "../pages/PatientRequests.vue";
import DoctorRequests from "../pages/DoctorRequests.vue";
import RequestDetails from "../pages/RequestDetails.vue";
import DoctorRequestDetail from "../pages/DoctorRequestDetail.vue";
import { useAuthStore } from "../api/auth";

const routes = [
    { path: "/login", component: Login },
    { path: "/register", component: Register },
    { path: "/patient-requests", component: PatientRequests, meta: { auth: true } },
    { path: "/", redirect: "/login" },
    {
        path: "/diagnosis_request/:id",
        component: () => import("../pages/RequestDetails.vue"),
        meta: { auth: true }
    },
    {
        path: "/request/:id",
        component: RequestDetails,
        meta: { auth: true }
    },
    {
        path: "/doctor-requests",
        component: DoctorRequests,
        meta: { auth: true, role: "dermatologist" },
    },
    {
        path: "/doctor-request/:id",
        component: DoctorRequestDetail,
        meta: { auth: true, role: "dermatologist" },
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Route guard
router.beforeEach((to, from, next) => {
    const store = useAuthStore();

    if (to.meta.auth) {
        // если нет токена → редирект на логин
        if (!store.access) return next("/login");

        // проверка роли
        if (to.path === "/patient-requests" && store.role !== "patient") return next("/login");
        if (to.path === "/doctor-requests" && store.role !== "dermatologist") return next("/login");
    }

    // если пользователь зашел на "/" → редирект по роли
    if (to.path === "/") {
        if (store.role === "patient") return next("/patient-requests");
        if (store.role === "dermatologist") return next("/doctor-requests");
    }

    next();
});
