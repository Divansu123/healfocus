const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { success, error } = require("../utils/response");
const { notifyHospital } = require("../config/socket");

// ─── Profile ──────────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patient: true },
    });
    if (!user) return error(res, "Not found", 404);
    const { passwordHash, ...safe } = user;
    return success(res, safe);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, age, gender, bloodType, city, allergies, conditions } =
      req.body;
    const pid = req.user.patientId;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
    });
    await prisma.patient.update({
      where: { id: pid },
      data: {
        age: age ? parseInt(age) : undefined,
        gender,
        bloodType,
        city,
        allergies,
        conditions,
      },
    });
    return success(res, null, "Profile updated");
  } catch (err) {
    next(err);
  }
};

// ─── Appointments ─────────────────────────────────────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const data = await prisma.appointment.findMany({
      where: { patientId: req.user.patientId },
      include: { doctor: true, hospital: true },
      orderBy: { date: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, date, time, reason } = req.body;

    const appt = await prisma.appointment.create({
      data: {
        patientId: req.user.patientId,
        doctorId: parseInt(doctorId),
        hospitalId: parseInt(hospitalId),
        date,
        time,
        reason,
        status: "pending",
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor: { select: { name: true } },
      },
    });

    // ─── Notify hospital in real-time ─────────────────────────────────────────
    const patientName = appt.patient?.user?.name || "A patient";
    const doctorName = appt.doctor?.name || "Doctor";
    const notif = await prisma.notification.create({
      data: {
        hospitalId: parseInt(hospitalId),
        type: "appt",
        icon: "calendar",
        title: "New Appointment Request",
        msg: `${patientName} has booked an appointment with Dr. ${doctorName} on ${date} at ${time}. Reason: ${reason || "N/A"}`,
      },
    });
    notifyHospital(parseInt(hospitalId), notif);

    return success(res, appt, "Appointment booked", 201);
  } catch (err) {
    next(err);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appt = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!appt) return error(res, "Appointment not found", 404);
    await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return success(res, null, "Appointment cancelled");
  } catch (err) {
    next(err);
  }
};

// ─── Medical Records ──────────────────────────────────────────────────────────
const getMedicalRecords = async (req, res, next) => {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.user.patientId },
      orderBy: { date: "desc" },
    });
    return success(res, records);
  } catch (err) {
    next(err);
  }
};

const addMedicalRecord = async (req, res, next) => {
  try {
    const { type, title, date, doctor, summary, tags, hospitalId } = req.body;
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: req.user.patientId,
        type,
        title,
        date,
        doctor,
        summary,
        tags: tags ? tags.join(",") : null,
        hospitalId: hospitalId ? parseInt(hospitalId) : null,
        addedBy: "patient",
      },
    });
    return success(res, record, "Record added", 201);
  } catch (err) {
    next(err);
  }
};

const deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rec = await prisma.medicalRecord.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!rec) return error(res, "Record not found", 404);
    await prisma.medicalRecord.delete({ where: { id } });
    return success(res, null, "Record deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Blood Sugar ──────────────────────────────────────────────────────────────
const getBloodSugar = async (req, res, next) => {
  try {
    const data = await prisma.bloodSugarReading.findMany({
      where: { patientId: req.user.patientId },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
    // Normalize type back to frontend format
    const normalized = data.map((r) => ({
      ...r,
      type: r.type === "post_meal" ? "post-meal" : r.type,
    }));
    return success(res, normalized);
  } catch (err) {
    next(err);
  }
};

const addBloodSugar = async (req, res, next) => {
  try {
    const { value, type, date, time, notes } = req.body;
    // Normalize type: frontend sends 'post-meal', Prisma enum uses 'post_meal'
    const normalizedType =
      type === "post-meal" ? "post_meal" : type || "fasting";
    const r = await prisma.bloodSugarReading.create({
      data: {
        patientId: req.user.patientId,
        value: parseFloat(value),
        type: normalizedType,
        date,
        time,
        notes,
      },
    });
    // Return with frontend-friendly type value
    return success(
      res,
      { ...r, type: r.type === "post_meal" ? "post-meal" : r.type },
      "Reading added",
      201,
    );
  } catch (err) {
    next(err);
  }
};

const deleteBloodSugar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.bloodSugarReading.findFirst({
      where: { id: parseInt(id), patientId: req.user.patientId },
    });
    if (!r) return error(res, "Reading not found", 404);
    await prisma.bloodSugarReading.delete({ where: { id: parseInt(id) } });
    return success(res, null, "Reading deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Blood Pressure ───────────────────────────────────────────────────────────
const getBloodPressure = async (req, res, next) => {
  try {
    const data = await prisma.bloodPressureReading.findMany({
      where: { patientId: req.user.patientId },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addBloodPressure = async (req, res, next) => {
  try {
    const { systolic, diastolic, pulse, date, time, notes } = req.body;
    const r = await prisma.bloodPressureReading.create({
      data: {
        patientId: req.user.patientId,
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : null,
        date,
        time,
        notes,
      },
    });
    return success(res, r, "Reading added", 201);
  } catch (err) {
    next(err);
  }
};

const deleteBloodPressure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.bloodPressureReading.findFirst({
      where: { id: parseInt(id), patientId: req.user.patientId },
    });
    if (!r) return error(res, "Reading not found", 404);
    await prisma.bloodPressureReading.delete({ where: { id: parseInt(id) } });
    return success(res, null, "Reading deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Mood ─────────────────────────────────────────────────────────────────────
const getMoods = async (req, res, next) => {
  try {
    const data = await prisma.moodEntry.findMany({
      where: { patientId: req.user.patientId },
      orderBy: [{ date: "desc" }],
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addMood = async (req, res, next) => {
  try {
    const { emoji, label, score, date, time, notes } = req.body;
    const r = await prisma.moodEntry.create({
      data: {
        patientId: req.user.patientId,
        emoji,
        label,
        score: parseInt(score),
        date,
        time,
        notes,
      },
    });
    return success(res, r, "Mood logged", 201);
  } catch (err) {
    next(err);
  }
};

// ─── Vaccinations ─────────────────────────────────────────────────────────────
const getVaccinations = async (req, res, next) => {
  try {
    const data = await prisma.vaccination.findMany({
      where: { patientId: req.user.patientId },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addVaccination = async (req, res, next) => {
  try {
    const { name, date, status, nextDue } = req.body;
    const r = await prisma.vaccination.create({
      data: { patientId: req.user.patientId, name, date, status, nextDue },
    });
    return success(res, r, "Vaccination added", 201);
  } catch (err) {
    next(err);
  }
};

// ─── Reminders ────────────────────────────────────────────────────────────────
const getReminders = async (req, res, next) => {
  try {
    const data = await prisma.reminder.findMany({
      where: { patientId: req.user.patientId },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addReminder = async (req, res, next) => {
  try {
    const { type, icon, title, time, freq } = req.body;
    const r = await prisma.reminder.create({
      data: { patientId: req.user.patientId, type, icon, title, time, freq },
    });
    return success(res, r, "Reminder added", 201);
  } catch (err) {
    next(err);
  }
};

const toggleReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.reminder.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!r) return error(res, "Reminder not found", 404);
    const updated = await prisma.reminder.update({
      where: { id },
      data: { done: !r.done },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.reminder.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!r) return error(res, "Reminder not found", 404);
    await prisma.reminder.delete({ where: { id } });
    return success(res, null, "Reminder deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Family Members ───────────────────────────────────────────────────────────
const getFamilyMembers = async (req, res, next) => {
  try {
    const data = await prisma.familyMember.findMany({
      where: { patientId: req.user.patientId },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addFamilyMember = async (req, res, next) => {
  try {
    const {
      name,
      age,
      relation,
      icon,
      bloodType,
      phone,
      allergies,
      conditions,
    } = req.body;
    const r = await prisma.familyMember.create({
      data: {
        patientId: req.user.patientId,
        name,
        age: age ? parseInt(age) : null,
        relation,
        icon,
        bloodType,
        phone,
        allergies,
        conditions,
      },
    });
    return success(res, r, "Family member added", 201);
  } catch (err) {
    next(err);
  }
};

const deleteFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.familyMember.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!r) return error(res, "Family member not found", 404);
    await prisma.familyMember.delete({ where: { id } });
    return success(res, null, "Deleted");
  } catch (err) {
    next(err);
  }
};

// ─── Insurance ────────────────────────────────────────────────────────────────
const getInsurance = async (req, res, next) => {
  try {
    const cards = await prisma.insuranceCard.findMany({
      where: { patientId: req.user.patientId },
      include: { claims: true },
    });
    return success(res, cards);
  } catch (err) {
    next(err);
  }
};

const addInsuranceCard = async (req, res, next) => {
  try {
    const {
      provider,
      policyNo,
      type,
      coverAmount,
      premium,
      validFrom,
      validTo,
      membersName,
      tpaName,
      emergencyNo,
    } = req.body;
    const card = await prisma.insuranceCard.create({
      data: {
        patientId: req.user.patientId,
        provider,
        policyNo,
        type,
        coverAmount: coverAmount ? parseFloat(coverAmount) : null,
        premium: premium ? parseFloat(premium) : null,
        validFrom,
        validTo,
        membersName,
        tpaName,
        emergencyNo,
      },
    });
    return success(res, card, "Insurance card added", 201);
  } catch (err) {
    next(err);
  }
};

// ─── Admissions ───────────────────────────────────────────────────────────────
const getAdmissions = async (req, res, next) => {
  try {
    const data = await prisma.admission.findMany({
      where: { patientId: req.user.patientId },
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

const requestAdmission = async (req, res, next) => {
  try {
    const { type, treatmentName, hospital, preferredDate, urgency, notes } =
      req.body;
    if (!treatmentName) return error(res, "Treatment name is required", 400);
    // Normalize urgency: 'semi-urgent' is not in enum, map to 'urgent'
    const urgencyMap = {
      planned: "planned",
      "semi-urgent": "urgent",
      urgent: "urgent",
      emergency: "emergency",
    };
    const normalizedUrgency = urgencyMap[urgency] || "planned";
    const adm = await prisma.admission.create({
      data: {
        patientId: req.user.patientId,
        type: type || "Surgery",
        treatmentName,
        hospital: hospital || "",
        preferredDate: preferredDate || null,
        urgency: normalizedUrgency,
        notes: notes || null,
      },
    });
    return success(res, adm, "Admission request submitted", 201);
  } catch (err) {
    next(err);
  }
};

// ─── Notifications ────────────────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const data = await prisma.notification.findMany({
      where: { patientId: req.user.patientId },
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
      where: { id, patientId: req.user.patientId },
      data: { read: true },
    });
    return success(res, null, "Marked as read");
  } catch (err) {
    next(err);
  }
};

// ─── Consent ──────────────────────────────────────────────────────────────────
const getConsentRequests = async (req, res, next) => {
  try {
    const data = await prisma.consentRequest.findMany({
      where: { patientId: req.user.patientId },
      orderBy: { requestedAt: "desc" },
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const respondToConsent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const r = await prisma.consentRequest.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!r) return error(res, "Consent request not found", 404);
    await prisma.consentRequest.update({ where: { id }, data: { status } });
    return success(res, null, `Consent ${status}`);
  } catch (err) {
    next(err);
  }
};

// ─── Insurance Claims ─────────────────────────────────────────────────────────
const getInsuranceClaims = async (req, res, next) => {
  try {
    const claims = await prisma.insuranceClaim.findMany({
      where: { patientId: req.user.patientId },
      include: { insurance: true },
      orderBy: { createdAt: "desc" },
    });
    return success(res, claims);
  } catch (err) {
    next(err);
  }
};

const addInsuranceClaim = async (req, res, next) => {
  try {
    const { insuranceId, claimNo, date, hospital, reason, amount } = req.body;
    if (!claimNo || !date || !hospital)
      return require("../utils/response").error(
        res,
        "claimNo, date and hospital required",
        400,
      );
    const claim = await prisma.insuranceClaim.create({
      data: {
        patientId: req.user.patientId,
        insuranceId,
        claimNo,
        date,
        hospital,
        reason,
        amount: amount ? parseFloat(amount) : null,
        status: "processing",
      },
    });
    return success(res, claim, "Claim submitted", 201);
  } catch (err) {
    next(err);
  }
};

// ─── SOS Contacts ─────────────────────────────────────────────────────────────
const getSosContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.sosContact.findMany({
      where: { patientId: req.user.patientId },
      orderBy: { createdAt: "asc" },
    });
    return success(res, contacts);
  } catch (err) {
    next(err);
  }
};

const addSosContact = async (req, res, next) => {
  try {
    const { name, relation, phone, icon } = req.body;
    if (!name || !phone)
      return require("../utils/response").error(
        res,
        "name and phone required",
        400,
      );
    const contact = await prisma.sosContact.create({
      data: {
        patientId: req.user.patientId,
        name,
        relation: relation || "Other",
        phone,
        icon: icon || "👤",
      },
    });
    return success(res, contact, "Contact added", 201);
  } catch (err) {
    next(err);
  }
};

const deleteSosContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const c = await prisma.sosContact.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!c) return require("../utils/response").error(res, "Not found", 404);
    await prisma.sosContact.delete({ where: { id } });
    return success(res, null, "Contact removed");
  } catch (err) {
    next(err);
  }
};

// ─── Medical Record File Upload ───────────────────────────────────────────────
const uploadRecordFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return require("../utils/response").error(res, "No files uploaded", 400);
    }

    // Verify the record belongs to this patient
    const record = await prisma.medicalRecord.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!record) {
      return require("../utils/response").error(res, "Record not found", 404);
    }

    // Merge with existing attachments
    const newFilenames = req.files.map((f) => f.filename);
    const existing = record.attachments
      ? record.attachments.split(",").filter(Boolean)
      : [];
    const merged = [...existing, ...newFilenames].join(",");

    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: { attachments: merged },
    });

    return success(
      res,
      { attachments: merged.split(",").filter(Boolean) },
      "Files uploaded successfully"
    );
  } catch (err) {
    next(err);
  }
};

// ─── Skin Scan Upload ─────────────────────────────────────────────────────────
// ─── Insurance Card File Upload ───────────────────────────────────────────────
const uploadInsuranceFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return require("../utils/response").error(res, "No files uploaded", 400);
    }

    const card = await prisma.insuranceCard.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!card) {
      return require("../utils/response").error(res, "Insurance card not found", 404);
    }

    const newFilenames = req.files.map((f) => f.filename);
    const existing = card.attachments
      ? card.attachments.split(",").filter(Boolean)
      : [];
    const merged = [...existing, ...newFilenames].join(",");

    await prisma.insuranceCard.update({
      where: { id },
      data: { attachments: merged },
    });

    return success(
      res,
      { attachments: merged.split(",").filter(Boolean) },
      "Files uploaded successfully"
    );
  } catch (err) {
    next(err);
  }
};

// ─── Insurance Claim File Upload ──────────────────────────────────────────────
const uploadClaimFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return require("../utils/response").error(res, "No files uploaded", 400);
    }

    const claim = await prisma.insuranceClaim.findFirst({
      where: { id, patientId: req.user.patientId },
    });
    if (!claim) {
      return require("../utils/response").error(res, "Claim not found", 404);
    }

    const newFilenames = req.files.map((f) => f.filename);
    const existing = claim.attachments
      ? claim.attachments.split(",").filter(Boolean)
      : [];
    const merged = [...existing, ...newFilenames].join(",");

    await prisma.insuranceClaim.update({
      where: { id },
      data: { attachments: merged },
    });

    return success(
      res,
      { attachments: merged.split(",").filter(Boolean) },
      "Files uploaded successfully"
    );
  } catch (err) {
    next(err);
  }
};

const uploadSkinImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return require("../utils/response").error(res, "No image uploaded", 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return success(
      res,
      {
        filename: req.file.filename,
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      "Skin scan uploaded successfully"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAppointments,
  bookAppointment,
  cancelAppointment,
  getMedicalRecords,
  addMedicalRecord,
  deleteMedicalRecord,
  uploadRecordFiles,
  uploadSkinImage,
  uploadInsuranceFiles,
  uploadClaimFiles,
  getBloodSugar,
  addBloodSugar,
  deleteBloodSugar,
  getBloodPressure,
  addBloodPressure,
  deleteBloodPressure,
  getMoods,
  addMood,
  getVaccinations,
  addVaccination,
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  getFamilyMembers,
  addFamilyMember,
  deleteFamilyMember,
  getInsurance,
  addInsuranceCard,
  getInsuranceClaims,
  addInsuranceClaim,
  getSosContacts,
  addSosContact,
  deleteSosContact,
  getAdmissions,
  requestAdmission,
  getNotifications,
  markNotificationRead,
  getConsentRequests,
  respondToConsent,
};
