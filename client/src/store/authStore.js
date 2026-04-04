import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─────────────────────────────────────────────
//  Auth Store — persists to localStorage
//  Replace with real JWT flow when backend ready
// ─────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,          // { id, name, email, role, hospitalId? }
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('hf_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('hf_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (data) => set((state) => ({
        user: { ...state.user, ...data }
      })),
    }),
    {
      name: 'healfocus-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ─────────────────────────────────────────────
//  UI Store — ephemeral state (no persistence)
// ─────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))
