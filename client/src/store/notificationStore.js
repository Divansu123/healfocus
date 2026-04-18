import { create } from 'zustand'

/**
 * Shared Notification Store — Real-time updates via Socket.io
 * 
 * Ek hi store hai Admin, Doctor aur Patient ke liye.
 * Socket se directly yahan update hota hai, isliye
 * page reload ki zaroorat nahi padti.
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  // Puri list set karo (initial load pe)
  setNotifications: (list) => set({
    notifications: list,
    unreadCount: list.filter(n => !n.read).length,
  }),

  // Real-time: naya notification aaya (socket se)
  addNotification: (notif) => set((state) => ({
    notifications: [notif, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  // Ek notification read mark karo
  markRead: (id) => set((state) => {
    const wasUnread = state.notifications.find(n => n.id === id && !n.read)
    return {
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }
  }),

  // Sab read mark karo
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  setLoading: (loading) => set({ loading }),

  // Logout pe reset
  reset: () => set({ notifications: [], unreadCount: 0, loading: false }),
}))
