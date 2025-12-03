import { ref } from "vue";
import { defineStore } from "pinia";

export const useAuthStore = defineStore('auth', () => {
    const access = ref(localStorage.getItem('access') || null);
    const refresh = ref(localStorage.getItem('refresh') || null);
    const role = ref(localStorage.getItem('role') || null);
    const username = ref(localStorage.getItem('username') || null);
    const userId = ref(localStorage.getItem('userId') || null);

    function setTokens(data) {
        access.value = data.access;
        refresh.value = data.refresh;
        role.value = data.role;
        username.value = data.username;
        userId.value = data.id;

        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.id);
    }

    function logout() {
        access.value = null;
        refresh.value = null;
        role.value = null;
        username.value = null;
        userId.value = null;

        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
    }

    return { access, refresh, role, username, userId, setTokens, logout }
});
