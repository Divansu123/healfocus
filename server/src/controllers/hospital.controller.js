const prisma = require("../config/prisma");
const { success, error } = require("../utils/response");

const getHospitalId = (req) => req.user.hospitalId;

// ✅ slots normalizer
const normalizeSlots = (slots) => {
  if (!slots) return [];

  // agar string me aaya ho
  if (typeof slots === "string") {
    // pehle JSON array try karo
    try {
      const parsed = JSON.parse(slots);
      slots = parsed;
    } catch (e) {
      // comma-separated string split karo e.g. "09:00,10:00,11:00"
      slots = slots.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  // agar single object ya single value aayi ho (array nahi)
  if (!Array.isArray(slots)) {
    slots = [slots];
  }

  // final cleanup
  return slots
    .map((slot) => {
      if (typeof slot === "string") return slot.trim();
      if (typeof slot === "object" && slot?.time)
        return String(slot.time).trim();
      return null;
    })
    .filter(Boolean);
};

// ─── Appointments ─────────────────────────────────────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const data = await prisma.appointment.findMany({
      where: {
        hospitalId: getHospitalId(req),
        ...(date && { date }),
        ...(status && { status }),
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        doctor: true,
      },
      orderBy: { date: "asc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appt = await prisma.appointment.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!appt) return error(res, "Appointment not found", 404);
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    return success(res, updated, "Appointment updated");
  } catch (err) {
    next(err);
  }
};

// ─── Doctors ──────────────────────────────────────────────────────────────────
const getDoctors = async (req, res, next) => {
  try {
    const data = await prisma.doctor.findMany({
      where: { hospitalId: getHospitalId(req) },
      include: { slots: true },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addDoctor = async (req, res, next) => {
  try {
    let {
      name,
      speciality,
      specialityId,
      icon,
      exp,
      fee,
      bg,
      availability,
      slots,
    } = req.body;

    // ✅ normalize slots
    const normalizedSlots = normalizeSlots(slots);

    console.log("req.body =>", req.body);
    console.log("normalizedSlots =>", normalizedSlots);

    const doc = await prisma.doctor.create({
      data: {
        hospitalId: getHospitalId(req),
        name,
        speciality,
        specialityId,
        icon,
        exp: exp ? parseInt(exp) : null,
        fee: fee ? parseFloat(fee) : null,
        bg,
        availability,
        slots: normalizedSlots.length
          ? {
              create: normalizedSlots.map((t) => ({ time: t })),
            }
          : undefined,
      },
      include: { slots: true },
    });

    return success(res, doc, "Doctor added", 201);
  } catch (err) {
    next(err);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, speciality, specialityId, exp, fee, bg, availability, slots } =
      req.body;

    const doctorId = parseInt(id);

    const doc = await prisma.doctor.findFirst({
      where: { id: doctorId, hospitalId: getHospitalId(req) },
    });

    if (!doc) return error(res, "Doctor not found", 404);

    // ✅ Replace slots if provided
    if (slots !== undefined) {
      const normalizedSlots = normalizeSlots(slots);

      await prisma.doctorSlot.deleteMany({
        where: { doctorId },
      });

      if (normalizedSlots.length) {
        await prisma.doctorSlot.createMany({
          data: normalizedSlots.map((t) => ({
            doctorId,
            time: t,
          })),
        });
      }
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        name,
        speciality,
        specialityId,
        exp: exp ? parseInt(exp) : undefined,
        fee: fee ? parseFloat(fee) : undefined,
        bg,
        availability,
      },
      include: { slots: true },
    });

    return success(res, updated, "Doctor updated");
  } catch (err) {
    next(err);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await prisma.doctor.findFirst({
      where: { id: parseInt(id), hospitalId: getHospitalId(req) },
    });
    if (!doc) return error(res, "Doctor not found", 404);
    await prisma.doctor.delete({ where: { id: parseInt(id) } });
    return success(res, null, "Doctor removed");
  } catch (err) {
    next(err);
  }
};

// ─── OPD Patients ─────────────────────────────────────────────────────────────
const getOpdPatients = async (req, res, next) => {
  try {
    const { date } = req.query;
    const data = await prisma.opdPatient.findMany({
      where: {
        hospitalId: getHospitalId(req),
        ...(date && { visitDate: date }),
      },
      include: { doctor: true },
      orderBy: { tokenNo: "asc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addOpdPatient = async (req, res, next) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      visitDate,
      time,
      doctorId,
      complaint,
      tokenNo,
    } = req.body;
    const opd = await prisma.opdPatient.create({
      data: {
        hospitalId: getHospitalId(req),
        doctorId: doctorId ? parseInt(doctorId) : null,
        name,
        age: age ? parseInt(age) : null,
        gender,
        phone,
        visitDate,
        time,
        complaint,
        tokenNo: tokenNo ? parseInt(tokenNo) : null,
      },
    });
    return success(res, opd, "OPD patient added", 201);
  } catch (err) {
    next(err);
  }
};

const updateOpdPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opd = await prisma.opdPatient.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!opd) return error(res, "OPD patient not found", 404);
    const updated = await prisma.opdPatient.update({
      where: { id },
      data: req.body,
    });
    return success(res, updated, "OPD patient updated");
  } catch (err) {
    next(err);
  }
};

// ─── Promotions ───────────────────────────────────────────────────────────────
const getPromotions = async (req, res, next) => {
  try {
    const data = await prisma.promotion.findMany({
      where: { hospitalId: getHospitalId(req) },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addPromotion = async (req, res, next) => {
  try {
    const {
      title,
      desc,
      type,
      discount,
      validTill,
      applicableTo,
      color,
      active,
    } = req.body;
    const promo = await prisma.promotion.create({
      data: {
        hospitalId: getHospitalId(req),
        title,
        desc,
        type,
        discount,
        validTill,
        applicableTo,
        color,
        active,
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
    const promo = await prisma.promotion.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!promo) return error(res, "Promotion not found", 404);
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
    const promo = await prisma.promotion.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!promo) return error(res, "Promotion not found", 404);
    await prisma.promotion.delete({ where: { id } });
    return success(res, null, "Promotion deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Service Requests ─────────────────────────────────────────────────────────
const getServiceRequests = async (req, res, next) => {
  try {
    const data = await prisma.serviceRequest.findMany({
      where: { hospitalId: getHospitalId(req) },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addServiceRequest = async (req, res, next) => {
  try {
    const { category, title, description, priority } = req.body;
    const hospital = await prisma.hospital.findUnique({
      where: { id: getHospitalId(req) },
    });
    const req2 = await prisma.serviceRequest.create({
      data: {
        hospitalId: getHospitalId(req),
        hospitalName: hospital?.name,
        category,
        title,
        description,
        priority,
      },
    });
    return success(res, req2, "Service request submitted", 201);
  } catch (err) {
    next(err);
  }
};

// ─── Indoor Bills ─────────────────────────────────────────────────────────────
const getBills = async (req, res, next) => {
  try {
    const data = await prisma.indoorBill.findMany({
      where: { hospitalId: getHospitalId(req) },
      include: { billItems: true },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createBill = async (req, res, next) => {
  try {
    const {
      patientId,
      patientName,
      insuranceId,
      admissionDate,
      dischargeDate,
      items,
    } = req.body;
    const bill = await prisma.indoorBill.create({
      data: {
        hospitalId: getHospitalId(req),
        patientId: patientId || 'manual',
        patientName,
        insuranceId,
        admissionDate,
        dischargeDate,
        billItems: {
          create:
            items?.map((i) => ({
              desc: i.desc,
              category: i.category,
              amount: parseFloat(i.amount),
              claimable: !!i.claimable,
            })) || [],
        },
      },
      include: { billItems: true },
    });
    return success(res, bill, "Bill created", 201);
  } catch (err) {
    next(err);
  }
};

const updateBillStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bill = await prisma.indoorBill.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!bill) return error(res, "Bill not found", 404);
    const updated = await prisma.indoorBill.update({
      where: { id },
      data: { status },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ─── Discharge Summaries ──────────────────────────────────────────────────────
const getDischargeSummaries = async (req, res, next) => {
  try {
    const data = await prisma.dischargeSummary.findMany({
      where: { hospitalId: getHospitalId(req) },
      orderBy: { createdAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createDischargeSummary = async (req, res, next) => {
  try {
    const body = req.body;
    const ds = await prisma.dischargeSummary.create({
      data: { ...body, hospitalId: getHospitalId(req) },
    });
    return success(res, ds, "Discharge summary created", 201);
  } catch (err) {
    next(err);
  }
};

const updateDischargeSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ds = await prisma.dischargeSummary.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!ds) return error(res, "Summary not found", 404);
    const updated = await prisma.dischargeSummary.update({
      where: { id },
      data: req.body,
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ─── Hospital Notifications ───────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const data = await prisma.notification.findMany({
      where: { hospitalId: getHospitalId(req) },
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
    await prisma.notification.updateMany({
      where: { id, hospitalId: getHospitalId(req) },
      data: { read: true },
    });
    return success(res, null, "Marked as read");
  } catch (err) {
    next(err);
  }
};

// ─── Patient List (hospital sees their patients) ──────────────────────────────
const getPatients = async (req, res, next) => {
  try {
    const data = await prisma.appointment.findMany({
      where: { hospitalId: getHospitalId(req) },
      select: {
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      distinct: ["patientId"],
    });
    const patients = data.map((d) => d.patient);
    return success(res, patients);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAppointments,
  updateAppointment,
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getOpdPatients,
  addOpdPatient,
  updateOpdPatient,
  getPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
  getServiceRequests,
  addServiceRequest,
  getBills,
  createBill,
  updateBillStatus,
  getDischargeSummaries,
  createDischargeSummary,
  updateDischargeSummary,
  getNotifications,
  markNotificationRead,
  getPatients,
};
