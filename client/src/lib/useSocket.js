import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import toast from "react-hot-toast";
import { playNotificationSound } from "@/lib/soundUtils";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

let socketInstance = null;

/**
 * Singleton socket connection return karta hai.
 * JWT token se connect hota hai.
 */
export function getSocket() {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (socketInstance && socketInstance.connected) return socketInstance;

  // Purana disconnect karo
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  return socketInstance;
}

/**
 * Socket disconnect aur cleanup
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Main hook: socket connect karta hai aur
 * har naye notification ko notificationStore mein add karta hai.
 * Agar admin ne hospital ko inactive/suspended kiya to forceLogout event
 * sun ke automatically logout karta hai.
 *
 * Usage:
 *   useSocket()                    // sirf store update
 *   useSocket((notif) => toast())  // store + callback
 */
export function useSocket(onNotification) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef(null);
  const callbackRef = useRef(onNotification);

  // Latest callback ref mein rakho (stale closure se bachne ke liye)
  useEffect(() => {
    callbackRef.current = onNotification;
  });

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const handler = (notif) => {
      // Store mein add karo — badge aur list dono update ho jaayenge
      addNotification(notif);
      // 🔔 Notification sound bajao
      playNotificationSound();
      // Optional callback (e.g. toast)
      if (typeof callbackRef.current === "function") {
        callbackRef.current(notif);
      }
    };

    // ── Force Logout Handler — admin ne hospital suspend/inactive kiya ────────
    const forceLogoutHandler = ({ reason }) => {
      const message = reason || "Your account has been deactivated by the administrator.";
      // Toast dikhao
      toast.error(message, { duration: 6000 });
      // Logout karo
      setTimeout(() => {
        logout();
        // Login page pe redirect karo
        window.location.href = "/";
      }, 1500);
    };

    // Pehle remove karo taaki duplicate na ho
    socket.off("notification", handler);
    socket.on("notification", handler);

    // Force logout — sirf hospital role ke liye suno
    if (user?.role === "hospital") {
      socket.off("forceLogout", forceLogoutHandler);
      socket.on("forceLogout", forceLogoutHandler);
    }

    // Token expire pe reconnect with fresh token
    socket.on("connect_error", (err) => {
      if (err.message === "Invalid or expired token") {
        console.warn("[Socket] Token expired, reconnecting with fresh token...");
        disconnectSocket();
        // Naya socket fresh token se banao
        const newSocket = getSocket();
        if (newSocket) {
          socketRef.current = newSocket;
          newSocket.on("notification", handler);
          if (user?.role === "hospital") {
            newSocket.on("forceLogout", forceLogoutHandler);
          }
        }
      }
    });

    return () => {
      socket.off("notification", handler);
      socket.off("forceLogout", forceLogoutHandler);
      socket.off("connect_error");
    };
  }, [token, addNotification, logout, user?.role]);

  return socketRef;
}
