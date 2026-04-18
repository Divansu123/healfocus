const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { generateTokens, verifyRefreshToken, verifyAccessToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const logger = require("../config/logger");
const { notifyAdmin } = require("../config/socket");

// ─── Register (Patient only via public signup) ────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, age, gender, bloodType, city } =
      req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, "Email already registered", 409);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: "patient",
        phone,
        patient: {
          create: { age: age ? parseInt(age) : null, gender, bloodType, city },
        },
      },
      include: { patient: true },
    });

    // ─── Notify admin about new patient registration ──────────────────────
    try {
      const notif = await prisma.notification.create({
        data: {
          isAdmin: true,
          type: "patient_registered",
          icon: "👤",
          title: "New Patient Registered",
          msg: `${name} has registered as a new patient on Heal Focus.`,
        },
      });
      notifyAdmin(notif);
    } catch (notifErr) {
      // Notification failure should not block registration
      logger.warn("Failed to send admin notification for new patient", { err: notifErr.message });
    }

    logger.info("New patient registered", { userId: user.id });
    return success(
      res,
      { id: user.id, name: user.name, email: user.email },
      "Account created successfully",
      201,
    );
  } catch (err) {
    next(err);
  }
};

// ─── Login (all roles) ────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, hospital: true },
    });

    if (!user) return error(res, "Wrong Email", 401);

    // Role mismatch check
    if (user.role !== role) {
      return error(res, "Wrong email or password", 401);
    }

    // ── Hospital status check — inactive/suspended hospitals login nahi kar sakte ──
    if (user.role === "hospital" && user.hospital) {
      const hospitalStatus = user.hospital.status;
      if (hospitalStatus === "inactive") {
        return error(
          res,
          "Your hospital account has been deactivated. Please contact the administrator.",
          403
        );
      }
      if (hospitalStatus === "suspended") {
        return error(
          res,
          "Your hospital account has been suspended. Please contact the administrator.",
          403
        );
      }
    }

    if (password !== user.password) {
      return error(res, "Wrong Password", 401);
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      ...(user.role === "patient" && { patientId: user.patient?.id }),
      ...(user.role === "hospital" && { hospitalId: user.hospital?.id }),
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Set refresh token in httpOnly cookie
    res.cookie("hf_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(user.role === "patient" && {
        patientId: user.patient?.id,
        age: user.patient?.age,
        gender: user.patient?.gender,
        bloodType: user.patient?.bloodType,
        city: user.patient?.city,
        allergies: user.patient?.allergies,
        conditions: user.patient?.conditions,
      }),
      ...(user.role === "hospital" && { hospitalId: user.hospital?.id }),
    };

    return success(res, { user: safeUser, accessToken }, "Login successful");
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  // Mark all current notifications as read (session clear)
  // Any new notifications arriving while logged out will remain unread
  // and will be shown prominently on next login
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = verifyAccessToken(token);
      const userId = decoded?.id;
      const role = decoded?.role;

      if (userId && role) {
        if (role === "patient") {
          const patient = await prisma.patient.findFirst({ where: { userId } });
          if (patient) {
            await prisma.notification.updateMany({
              where: { patientId: patient.id, read: false },
              data: { read: true },
            });
          }
        } else if (role === "hospital") {
          const hospital = await prisma.hospital.findFirst({ where: { adminId: userId } });
          if (hospital) {
            await prisma.notification.updateMany({
              where: { hospitalId: hospital.id, read: false },
              data: { read: true },
            });
          }
        } else if (role === "admin") {
          await prisma.notification.updateMany({
            where: { isAdmin: true, read: false },
            data: { read: true },
          });
        }
      }
    } catch (_) {
      // Token expired or invalid — skip silently
    }
  }

  res.clearCookie("hf_refresh", { httpOnly: true, sameSite: "strict" });
  return success(res, null, "Logged out successfully");
};

// ─── Refresh access token ─────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.hf_refresh;
    if (!token) return error(res, "Refresh token missing", 401);

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { patient: true, hospital: true },
    });
    if (!user) return error(res, "User not found", 401);

    // ── Hospital status check — suspended/inactive ka token refresh block karo ──
    if (user.role === "hospital" && user.hospital) {
      const hospitalStatus = user.hospital.status;
      if (hospitalStatus === "inactive" || hospitalStatus === "suspended") {
        return error(res, "Hospital account is not active. Please contact the administrator.", 403);
      }
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      ...(user.role === "patient" && { patientId: user.patient?.id }),
      ...(user.role === "hospital" && { hospitalId: user.hospital?.id }),
    };

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(tokenPayload);

    res.cookie("hf_refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, { accessToken }, "Token refreshed");
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return error(res, "Refresh token expired. Please login again.", 401);
    next(err);
  }
};

// ─── Get current user (me) ────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patient: true, hospital: true },
    });
    if (!user) return error(res, "User not found", 404);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(user.role === "patient" && {
        patientId: user.patient?.id,
        age: user.patient?.age,
        gender: user.patient?.gender,
        bloodType: user.patient?.bloodType,
        city: user.patient?.city,
        allergies: user.patient?.allergies,
        conditions: user.patient?.conditions,
      }),
      ...(user.role === "hospital" && { hospitalId: user.hospital?.id }),
    };
    return success(res, safeUser);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
