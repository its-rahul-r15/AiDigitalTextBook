import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
            setAccessToken: (accessToken) => set({ accessToken }),
            setUser: (user) => set({ user }),
        }),
        {
            name: 'dt-auth',
            partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
        }
    )
);
