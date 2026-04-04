const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { success, error } = require("../utils/response");

const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, "Email already registered", 409);

    const user = await prisma.user.create({
      data: { name, email, password, role: "admin", phone },
    });

    return success(
      res,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      "Admin account created",
      201,
    );
  } catch (err) {
    next(err);
  }
};

const createHospital = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      hospitalName,
      city,
      address,
      hospitalPhone,
      hospitalEmail,
      beds,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, "Email already registered", 409);

    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalName,
          city,
          address,
          phone: hospitalPhone,
          email: hospitalEmail,
          beds: beds ? parseInt(beds) : null,
          status: "active",
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password,
          role: "hospital",
          phone,
          hospital: { connect: { id: hospital.id } },
        },
      });

      await tx.hospital.update({
        where: { id: hospital.id },
        data: { adminId: user.id },
      });

      return { user, hospital };
    });

    return success(
      res,
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        hospital: { id: result.hospital.id, name: result.hospital.name },
      },
      "Hospital account created",
      201,
    );
  } catch (err) {
    next(err);
  }
};

// ─── Overview / Stats ─────────────────────────────────────────────────────────
const getOverview = async (req, res, next) => {
  try {
    const [
      hospitals,
      patients,
      appointments,
      admissions,
      serviceRequests,
      signupRequests,
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.admission.count(),
      prisma.serviceRequest.count({ where: { status: "pending" } }),
      prisma.hospitalSignupRequest.count({ where: { status: "pending" } }),
    ]);

    return success(res, {
      hospitals,
      patients,
      appointments,
      admissions,
      pendingServiceRequests: serviceRequests,
      pendingSignups: signupRequests,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Hospitals ────────────────────────────────────────────────────────────────
const getHospitals = async (req, res, next) => {
  try {
    const data = await prisma.hospital.findMany({
      include: { _count: { select: { doctors: true, appointments: true } } },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateHospitalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const h = await prisma.hospital.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return success(res, h, "Hospital status updated");
  } catch (err) {
    next(err);
  }
};

// ─── Hospital Signup Requests ─────────────────────────────────────────────────
const getSignupRequests = async (req, res, next) => {
  try {
    const data = await prisma.hospitalSignupRequest.findMany({
      orderBy: { requestedAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const approveSignupRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes, adminEmail, adminPassword } = req.body;

    const req2 = await prisma.hospitalSignupRequest.findUnique({
      where: { id },
    });

    if (!req2) return error(res, "Request not found", 404);

    if (req2.status !== "pending") {
      return error(res, "Request already processed", 400);
    }

    const finalEmail = adminEmail || req2.email;
    const finalPassword = adminPassword || "HealFocus@123";

    const existingUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    });

    if (existingUser) {
      return error(res, "User with this email already exists", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: req2.name,
          city: req2.city,
          address: req2.address,
          phone: req2.phone,
          email: req2.email,
          beds: req2.beds,
          status: "active",
        },
      });

      const adminUser = await tx.user.create({
        data: {
          name: req2.contact || req2.name,
          email: finalEmail,
          password: finalPassword, // ✅ plain text save
          role: "hospital",
        },
      });

      await tx.hospital.update({
        where: { id: hospital.id },
        data: { adminId: adminUser.id },
      });

      await tx.hospitalSignupRequest.update({
        where: { id },
        data: {
          status: "approved",
          adminNotes,
        },
      });

      return { hospital, adminUser };
    });

    return success(res, result, "Hospital approved and account created");
  } catch (err) {
    next(err);
  }
};
const rejectSignupRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    await prisma.hospitalSignupRequest.update({
      where: { id },
      data: { status: "rejected", adminNotes },
    });
    return success(res, null, "Request rejected");
  } catch (err) {
    next(err);
  }
};

// ─── All Patients ─────────────────────────────────────────────────────────────
const getPatients = async (req, res, next) => {
  try {
    const data = await prisma.patient.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true, createdAt: true },
        },
        _count: { select: { appointments: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

// ─── All Admissions ───────────────────────────────────────────────────────────
const getAdmissions = async (req, res, next) => {
  try {
    const data = await prisma.admission.findMany({
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateAdmissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adm = await prisma.admission.update({
      where: { id },
      data: { status },
    });
    return success(res, adm, "Admission status updated");
  } catch (err) {
    next(err);
  }
};

// ─── Promotions (global/admin) ────────────────────────────────────────────────
const getAllPromotions = async (req, res, next) => {
  try {
    const data = await prisma.promotion.findMany({
      include: { hospital: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createPromotion = async (req, res, next) => {
  try {
    const promo = await prisma.promotion.create({ data: req.body });
    return success(res, promo, "Promotion created", 201);
  } catch (err) {
    next(err);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.promotion.update({
      where: { id },
      data: req.body,
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.promotion.delete({ where: { id } });
    return success(res, null, "Promotion deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Service Requests ─────────────────────────────────────────────────────────
const getAllServiceRequests = async (req, res, next) => {
  try {
    const data = await prisma.serviceRequest.findMany({
      include: { hospital: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateServiceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status, adminNotes },
    });
    return success(res, updated, "Service request updated");
  } catch (err) {
    next(err);
  }
};

// ─── Team Members ─────────────────────────────────────────────────────────────
const getTeamMembers = async (req, res, next) => {
  try {
    const data = await prisma.teamMember.findMany({
      orderBy: { addedAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const { name, email, role, permissions, avatar } = req.body;
    const member = await prisma.teamMember.create({
      data: {
        name,
        email,
        role,
        permissions: permissions ? permissions.join(",") : null,
        avatar,
      },
    });
    return success(res, member, "Team member added", 201);
  } catch (err) {
    next(err);
  }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, avatar, permissions, status } = req.body;

    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        email,
        role,
        avatar,
        status,
        permissions: Array.isArray(permissions)
          ? permissions.join(",")
          : permissions || "",
      },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.teamMember.delete({ where: { id } });
    return success(res, null, "Team member removed");
  } catch (err) {
    next(err);
  }
};

// ─── Admin Notifications ──────────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const data = await prisma.notification.findMany({
      where: { isAdmin: true },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return success(res, null, "Marked as read");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAdmin,
  createHospital,
  getOverview,
  getHospitals,
  updateHospitalStatus,
  getSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
  getPatients,
  getAdmissions,
  updateAdmissionStatus,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllServiceRequests,
  updateServiceRequest,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getNotifications,
  markNotificationRead,
};
