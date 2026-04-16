const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { success, error } = require("../utils/response");

// ─── Create Admin Account ─────────────────────────────────────────────────────
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

// ─── Create Hospital (Admin-initiated, called from /admin/createHospital) ─────
// Frontend sends: name, city, address, beds, phone, email, type, contact, lat, lng, note
// Backend creates: hospital record + a hospital staff user account automatically
const createHospital = async (req, res, next) => {
  try {
    const {
      name,
      city,
      address,
      beds,
      phone,
      email,
      type,
      contact,
      lat,
      lng,
      note,
    } = req.body;

    // Validate required fields
    if (!name || !name.trim())
      return error(res, "Hospital name is required", 400);
    if (!city || !city.trim()) return error(res, "City is required", 400);
    if (!email || !email.trim()) return error(res, "Email is required", 400);
    if (!phone || !phone.trim()) return error(res, "Phone is required", 400);

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate hospital email
    const existingHosp = await prisma.hospital.findFirst({
      where: { email: cleanEmail },
    });
    if (existingHosp)
      return error(res, "A hospital with this email already exists", 409);

    // Check duplicate user email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser)
      return error(res, "A user with this email already exists", 409);

    // Auto-generate staff password: HealFocus@123 (admin can share this)
    const defaultPassword = "HealFocus@123";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create hospital record
      const hospital = await tx.hospital.create({
        data: {
          name: name.trim(),
          city: city.trim(),
          address: address?.trim() || "",
          phone: phone.trim(),
          email: cleanEmail,
          beds: beds ? parseInt(beds) : null,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          status: "active",
        },
      });

      // 2. Create staff login account for this hospital
      const staffUser = await tx.user.create({
        data: {
          name: contact?.trim() || name.trim(),
          email: cleanEmail,
          password: defaultPassword, // plain text — consistent with login check
          role: "hospital",
          phone: phone?.trim() || null,
          hospital: { connect: { id: hospital.id } },
        },
      });

      // 3. Link user as hospital admin
      await tx.hospital.update({
        where: { id: hospital.id },
        data: { adminId: staffUser.id },
      });

      return { hospital, staffUser };
    });

    return success(
      res,
      {
        hospital: {
          id: result.hospital.id,
          name: result.hospital.name,
          city: result.hospital.city,
          email: result.hospital.email,
        },
        loginCredentials: {
          email: cleanEmail,
          password: defaultPassword,
          note: "Share these credentials with the hospital staff",
        },
      },
      `Hospital "${name.trim()}" created successfully`,
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
      doctors,
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.admission.count(),
      prisma.serviceRequest.count({ where: { status: "pending" } }),
      prisma.hospitalSignupRequest.count({ where: { status: "pending" } }),
      prisma.doctor.count(),
    ]);

    // ── Appointment status breakdown ──────────────────────────────────────────
    const apptStatusGroups = await prisma.appointment.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    const apptByStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    apptStatusGroups.forEach((g) => {
      apptByStatus[g.status] = g._count.status;
    });

    // ── Patient gender breakdown ──────────────────────────────────────────────
    const genderGroups = await prisma.patient.groupBy({
      by: ["gender"],
      _count: { gender: true },
    });
    const patientByGender = { Male: 0, Female: 0, Other: 0 };
    genderGroups.forEach((g) => {
      const key = g.gender || "Other";
      patientByGender[key] = (patientByGender[key] || 0) + g._count.gender;
    });

    // ── Monthly appointments (last 6 months) ─────────────────────────────────
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const count = await prisma.appointment.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      monthlyData.push({ month: label, count });
    }

    // ── Appointments per hospital ─────────────────────────────────────────────
    const hospitalList = await prisma.hospital.findMany({
      select: { id: true, name: true },
    });
    const apptsByHospital = await prisma.appointment.groupBy({
      by: ["hospitalId"],
      _count: { hospitalId: true },
    });
    const hospApptMap = {};
    apptsByHospital.forEach((g) => {
      hospApptMap[g.hospitalId] = g._count.hospitalId;
    });
    const appointmentsPerHospital = hospitalList.map((h) => ({
      id: h.id,
      name: h.name,
      count: hospApptMap[h.id] || 0,
    }));

    // ── Popular specialties ───────────────────────────────────────────────────
    const specialtyAppts = await prisma.appointment.groupBy({
      by: ["doctorId"],
      _count: { doctorId: true },
    });
    const doctorSpecMap = await prisma.doctor.findMany({
      select: { id: true, speciality: true },
    });
    const specCount = {};
    specialtyAppts.forEach((g) => {
      const doc = doctorSpecMap.find((d) => d.id === g.doctorId);
      if (doc) {
        const spec = doc.speciality || "General";
        specCount[spec] = (specCount[spec] || 0) + g._count.doctorId;
      }
    });
    const popularSpecialties = Object.entries(specCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ── Pending alerts ────────────────────────────────────────────────────────
    const pendingAdmissions = await prisma.admission.count({ where: { status: "pending" } });

    return success(res, {
      // Basic counts
      hospitals,
      patients,
      appointments,
      admissions,
      doctors,
      pendingServiceRequests: serviceRequests,
      pendingSignups: signupRequests,
      // Analytics
      apptByStatus,
      patientByGender,
      monthlyAppointments: monthlyData,
      appointmentsPerHospital,
      popularSpecialties,
      pendingAdmissions,
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

    const finalEmail = (adminEmail || req2.email).toLowerCase();
    const finalPassword = adminPassword || "HealFocus@123";

    const existingUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    });

    if (existingUser) {
      return error(res, "User with this email already exists", 400);
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const hospital = await tx.hospital.create({
          data: {
            name: req2.name,
            city: req2.city,
            address: req2.address || "",
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
            password: finalPassword,
            role: "hospital",
            hospital: { connect: { id: hospital.id } },
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
            adminNotes: adminNotes || null,
          },
        });

        return { hospital, adminUser };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

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
    // Normalize urgency back to frontend format
    const normalized = data.map((a) => ({
      ...a,
      urgency: a.urgency === "semi_urgent" ? "semi-urgent" : a.urgency,
    }));
    return success(res, normalized);
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

// ─── Promotions ───────────────────────────────────────────────────────────────
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
    const {
      title,
      desc,
      description,
      type,
      discount,
      validTill,
      applicableTo,
      color,
      active,
    } = req.body;
    if (!title) return error(res, "Title required", 400);
    const promo = await prisma.promotion.create({
      data: {
        title,
        desc: desc || description || "", // schema field is 'desc'
        type: type || "Discount",
        discount: discount || "",
        validTill: validTill || null, // store as string, not Date
        applicableTo: applicableTo || "all",
        color: color || "linear-gradient(135deg,#1a73e8,#60a5fa)",
        active: active !== undefined ? Boolean(active) : true,
      },
    });
    return success(res, promo, "Promotion created", 201);
  } catch (err) {
    next(err);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      desc,
      description,
      type,
      discount,
      validTill,
      applicableTo,
      color,
      active,
    } = req.body;
    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        title,
        desc: desc || description || "", // schema field is 'desc'
        type: type || "Discount",
        discount: discount || "",
        validTill: validTill || null,
        applicableTo: applicableTo || "all",
        color: color || "linear-gradient(135deg,#1a73e8,#60a5fa)",
        active: active !== undefined ? Boolean(active) : true,
      },
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
        permissions: Array.isArray(permissions)
          ? permissions.join(",")
          : permissions || "",
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

// ─── Patient Medical Records (with consent check) ─────────────────────────────
const getPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    // Check consent - admin can only view if patient has granted admin consent
    const consent = await prisma.consentRequest.findFirst({
      where: { patientId, role: "admin", status: "approved" },
    });
    if (!consent)
      return error(
        res,
        "Patient has not granted consent for admin access",
        403,
      );
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { date: "desc" },
    });
    return success(res, records);
  } catch (err) {
    next(err);
  }
};

// ─── All Consent Requests (admin view) ────────────────────────────────────────
const getAllConsentRequests = async (req, res, next) => {
  try {
    const data = await prisma.consentRequest.findMany({
      include: {
        patient: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

// ─── Request consent from patient ─────────────────────────────────────────────
const requestPatientConsent = async (req, res, next) => {
  try {
    const { patientId, purpose } = req.body;
    if (!patientId) return error(res, "patientId required", 400);
    // Check if already pending/approved
    const existing = await prisma.consentRequest.findFirst({
      where: {
        patientId,
        role: "admin",
        status: { in: ["pending", "approved"] },
      },
    });
    if (existing)
      return error(
        res,
        existing.status === "approved"
          ? "Consent already granted"
          : "Consent request already pending",
        409,
      );
    const req2 = await prisma.consentRequest.create({
      data: {
        patientId,
        requestedBy: "admin",
        role: "admin",
        hospName: "Heal Focus Admin",
        purpose: purpose || "Medical record review",
        status: "pending",
      },
    });
    return success(res, req2, "Consent request sent to patient", 201);
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
  getPatientRecords,
  getAllConsentRequests,
  requestPatientConsent,
};
