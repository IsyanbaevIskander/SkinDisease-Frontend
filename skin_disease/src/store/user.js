import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
    state: () => ({
        access: null,
        refresh: null,
        role: null,
        username: null,
    }),
    actions: {
        setAuth(data) {
            this.access = data.access;
            this.refresh = data.refresh;
            this.role = data.role;
            this.username = data.username;
        },
        logout() {
            this.$reset();
        }
    },
    persist: true
});
