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
      slots = slots
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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
    // Normalize status to frontend format
    const normalized = data.map((o) => ({
      ...o,
      status: o.status === "in_progress" ? "in-progress" : o.status,
    }));
    return success(res, normalized);
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
      status,
      weight,
      bloodPressure,
      temperature,
      generalAppearance,
      paymentMode,
      opdFee,
      followUpDate,
    } = req.body;
    if (!name) return error(res, "Patient name required", 400);
    // Normalize OPD status: frontend sends 'in-progress', Prisma enum uses 'in_progress'
    const normalizeOpdStatus = (s) => {
      if (s === "in-progress") return "in_progress";
      if (s === "in_progress") return "in_progress";
      if (s === "completed") return "completed";
      return "waiting";
    };
    const opd = await prisma.opdPatient.create({
      data: {
        hospitalId: getHospitalId(req),
        doctorId: doctorId ? parseInt(doctorId) : null,
        name,
        age: age ? parseInt(age) : null,
        gender,
        phone,
        visitDate: visitDate || new Date().toISOString().split("T")[0],
        time,
        complaint,
        tokenNo: tokenNo ? parseInt(tokenNo) : null,
        status: normalizeOpdStatus(status),
        weight: weight || null,
        bloodPressure: bloodPressure || null,
        temperature: temperature || null,
        generalAppearance: generalAppearance || null,
        paymentMode: paymentMode || null,
        opdFee: opdFee ? parseFloat(opdFee) : null,
        followUpDate: followUpDate || null,
      },
      include: { doctor: true },
    });
    // Return with frontend-friendly status
    const result = {
      ...opd,
      status: opd.status === "in_progress" ? "in-progress" : opd.status,
    };
    return success(res, result, "OPD patient added", 201);
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

    const body = { ...req.body };

    // ✅ Normalize status
    if (body.status) {
      body.status = body.status === "in-progress" ? "in_progress" : body.status;
    }

    // ✅ Normalize number fields
    if (body.age !== undefined) {
      body.age =
        body.age === "" || body.age === null ? null : parseInt(body.age);
    }

    if (body.doctorId !== undefined) {
      body.doctorId =
        body.doctorId === "" || body.doctorId === null
          ? null
          : parseInt(body.doctorId);
    }

    if (body.tokenNo !== undefined) {
      body.tokenNo =
        body.tokenNo === "" || body.tokenNo === null
          ? null
          : parseInt(body.tokenNo);
    }

    if (body.opdFee !== undefined) {
      body.opdFee =
        body.opdFee === "" || body.opdFee === null
          ? null
          : parseFloat(body.opdFee);
    }

    // Normalize string fields — empty string → null for optional fields
    const optionalStrings = ["weight", "bloodPressure", "temperature", "generalAppearance", "paymentMode", "followUpDate", "complaint", "diagnosis", "prescription", "followUp", "phone", "gender"];
    optionalStrings.forEach((key) => {
      if (body[key] !== undefined && body[key] === "") {
        body[key] = null;
      }
    });

    // ❌ Protected fields remove
    delete body.id;
    delete body.hospitalId;
    delete body.createdAt;
    delete body.updatedAt;

    const updated = await prisma.opdPatient.update({
      where: { id },
      data: body,
      include: { doctor: true },
    });

    const result = {
      ...updated,
      status: updated.status === "in_progress" ? "in-progress" : updated.status,
    };

    return success(res, result, "OPD patient updated");
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
        hospitalId: getHospitalId(req),
        title,
        desc: desc || description || "",
        type: type || "Discount",
        discount: discount || "",
        validTill: validTill || null,
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
    const promo = await prisma.promotion.findFirst({
      where: { id, hospitalId: getHospitalId(req) },
    });
    if (!promo) return error(res, "Promotion not found", 404);
    const {
      desc,
      description,
      validTill,
      active,
      id: _id,
      hospitalId: _hid,
      createdAt,
      updatedAt,
      ...rest
    } = req.body;
    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...rest,
        desc: desc || description || promo.desc || "",
        validTill: validTill || null,
        active: active !== undefined ? Boolean(active) : promo.active,
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
      patientAge,
      insuranceId,
      admissionDate,
      dischargeDate,
      paymentMode,
      items,
    } = req.body;
    if (!patientName) return error(res, "Patient name required", 400);
    const bill = await prisma.indoorBill.create({
      data: {
        hospitalId: getHospitalId(req),
        patientId: patientId || "manual",
        patientName,
        patientAge: patientAge ? parseInt(patientAge) : null,
        insuranceId: insuranceId || null,
        admissionDate: admissionDate || null,
        dischargeDate: dischargeDate || null,
        paymentMode: paymentMode || "Cashless",
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
    const {
      patientName,
      patientAge,
      patientId,
      diagnosisCode,
      primaryDiagnosis,
      admissionDate,
      dischargeDate,
      insuranceProvider,
      policyNo,
      policyAge,
      preExistingCovered,
      roomType,
      treatmentSummary,
      followUpDate,
      attendingDoctor,
      proceduresDone,
      medicinesAtDischarge,
      status,
    } = req.body;
    if (!patientName) return error(res, "Patient name required", 400);
    if (!primaryDiagnosis) return error(res, "Primary diagnosis required", 400);
    const ds = await prisma.dischargeSummary.create({
      data: {
        hospitalId: getHospitalId(req),
        patientId: patientId || "manual",
        patientName,
        patientAge: patientAge ? parseInt(patientAge) : null,
        diagnosisCode: diagnosisCode || null,
        primaryDiagnosis,
        admissionDate: admissionDate || null,
        dischargeDate: dischargeDate || null,
        insuranceProvider: insuranceProvider || null,
        policyNo: policyNo || null,
        policyAge: policyAge || null,
        preExistingCovered: preExistingCovered || null,
        roomType: roomType || "General Ward",
        treatmentSummary: treatmentSummary || null,
        followUpDate: followUpDate || null,
        attendingDoctor: attendingDoctor || null,
        proceduresDone: proceduresDone || null,
        medicinesAtDischarge: medicinesAtDischarge || null,
        status: status || "draft",
      },
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
    const {
      patientAge,
      patientId,
      hospitalId: _hid,
      id: _id,
      createdAt,
      updatedAt,
      ...rest
    } = req.body;
    const updated = await prisma.dischargeSummary.update({
      where: { id },
      data: {
        ...rest,
        patientAge:
          patientAge !== undefined
            ? patientAge
              ? parseInt(patientAge)
              : null
            : undefined,
      },
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

// ─── Consent-gated Patient Records ────────────────────────────────────────────
const getPatientRecords = async (req, res, next) => {
  try {
    const hospitalId = getHospitalId(req);
    const { patientId } = req.params;

    // Check approved consent from this hospital
    const consent = await prisma.consentRequest.findFirst({
      where: { patientId, hospitalId, role: 'hospital', status: 'approved' },
    });
    if (!consent) {
      return res.status(403).json({ success: false, message: 'Patient has not granted consent for record access' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
    return success(res, records);
  } catch (err) {
    next(err);
  }
};

// ─── Request Consent from Patient ─────────────────────────────────────────────
const requestPatientConsent = async (req, res, next) => {
  try {
    const hospitalId = getHospitalId(req);
    const { patientId, purpose } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Check if there's already a pending/approved consent from this hospital
    const existing = await prisma.consentRequest.findFirst({
      where: { patientId, hospitalId, role: 'hospital', status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.status === 'approved' ? 'Consent already granted' : 'A pending request already exists',
      });
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });

    const consent = await prisma.consentRequest.create({
      data: {
        patientId,
        hospitalId,
        requestedBy: req.user.id,
        role: 'hospital',
        hospName: hospital?.name || 'Hospital',
        purpose: purpose || 'Medical record access for treatment and care',
        status: 'pending',
      },
    });

    return success(res, consent, 'Consent request sent to patient', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Get Consent Requests sent by this hospital ───────────────────────────────
const getConsentRequests = async (req, res, next) => {
  try {
    const hospitalId = getHospitalId(req);
    const consents = await prisma.consentRequest.findMany({
      where: { hospitalId, role: 'hospital' },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
    return success(res, consents);
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
  getPatientRecords,
  requestPatientConsent,
  getConsentRequests,
};
