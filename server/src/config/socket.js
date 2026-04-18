const { Server } = require("socket.io");
const { verifyAccessToken: verifyToken } = require("../utils/jwt");

let io = null;

// Map to track connected users: userId -> Set of socketIds
const connectedUsers = new Map();

/**
 * Initialize Socket.io on the HTTP server
 */
function initSocket(httpServer) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production")
          return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyToken(token);
      socket.user = decoded; // { id, role, patientId?, hospitalId? }
      next();
    } catch (err) {
      console.error("[Socket] Auth failed:", err.message);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const role = socket.user.role;

    // Register socket in the connected-users map
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId).add(socket.id);

    // Join a role-based room so we can broadcast to all hospital staff, etc.
    if (role === "hospital" || role === "doctor") {
      socket.join(`hospital:${socket.user.hospitalId}`);
      console.log(`[Socket] ✅ ${role} connected | userId:${userId} | room:hospital:${socket.user.hospitalId}`);
    } else if (role === "patient") {
      socket.join(`patient:${socket.user.patientId}`);
      console.log(`[Socket] ✅ patient connected | userId:${userId} | room:patient:${socket.user.patientId}`);
    } else if (role === "admin") {
      socket.join("admin");
      console.log(`[Socket] ✅ admin connected | userId:${userId} | room:admin`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] ❌ disconnected | userId:${userId}`);
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) connectedUsers.delete(userId);
      }
    });
  });

  return io;
}

/**
 * Send a real-time notification to a specific patient room
 */
function notifyPatient(patientId, notification) {
  if (!io) return;
  console.log(`[Socket] 🔔 notifyPatient | patientId:${patientId}`);
  io.to(`patient:${patientId}`).emit("notification", notification);
}

/**
 * Send a real-time notification to a specific hospital room
 */
function notifyHospital(hospitalId, notification) {
  if (!io) return;
  console.log(`[Socket] 🔔 notifyHospital | hospitalId:${hospitalId}`);
  io.to(`hospital:${hospitalId}`).emit("notification", notification);
}

/**
 * Send a real-time notification to all admins
 */
function notifyAdmin(notification) {
  if (!io) return;
  console.log(`[Socket] 🔔 notifyAdmin`);
  io.to("admin").emit("notification", notification);
}

/**
 * Force logout a hospital — emits 'forceLogout' event to all connected hospital sockets
 * Called when admin marks a hospital as inactive or suspended
 */
function forceLogoutHospital(hospitalId, reason) {
  if (!io) return;
  console.log(`[Socket] 🔴 forceLogoutHospital | hospitalId:${hospitalId} | reason:${reason}`);
  io.to(`hospital:${hospitalId}`).emit("forceLogout", {
    reason: reason || "Your account has been suspended by the administrator.",
  });
}

function getIO() {
  return io;
}

module.exports = { initSocket, notifyPatient, notifyHospital, notifyAdmin, forceLogoutHospital, getIO };
