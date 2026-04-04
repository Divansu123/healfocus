const prisma = require('../config/prisma')
const { success, error } = require('../utils/response')

// ─── Specialties ──────────────────────────────────────────────────────────────
const getSpecialties = async (req, res, next) => {
  try {
    const data = await prisma.specialty.findMany()
    return success(res, data)
  } catch (err) { next(err) }
}

// ─── Hospitals ────────────────────────────────────────────────────────────────
const getHospitals = async (req, res, next) => {
  try {
    const { city } = req.query
    const data = await prisma.hospital.findMany({
      where: {
        status: 'active',
        ...(city && { city: { contains: city } }),
      },
      select: {
        id: true, name: true, icon: true, city: true, address: true,
        rating: true, beds: true, phone: true, email: true, lat: true, lng: true,
      },
    })
    return success(res, data)
  } catch (err) { next(err) }
}

// ─── Doctors ──────────────────────────────────────────────────────────────────
const getDoctors = async (req, res, next) => {
  try {
    const { specialityId, hospitalId } = req.query
    const data = await prisma.doctor.findMany({
      where: {
        hospital: { status: 'active' },
        ...(specialityId && { specialityId }),
        ...(hospitalId && { hospitalId: parseInt(hospitalId) }),
      },
      include: {
        slots: true,
        hospital: { select: { id: true, name: true, city: true } },
      },
    })
    return success(res, data)
  } catch (err) { next(err) }
}

const getDoctorSlots = async (req, res, next) => {
  try {
    const { id } = req.params
    const { date } = req.query

    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: { slots: true },
    })

    if (!doctor) return error(res, 'Doctor not found', 404)

    // Already booked appointments
    const bookedSlots = date
      ? await prisma.appointment.findMany({
          where: {
            doctorId: parseInt(id),
            date,
            status: { not: 'cancelled' },
          },
          select: { time: true },
        })
      : []

    const bookedTimes = new Set(bookedSlots.map((a) => a.time))

    // Split all comma-separated slot strings into single slots
    const allSlots = doctor.slots.flatMap((s) =>
      s.time
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    )

    // Remove duplicates if any
    const uniqueSlots = [...new Set(allSlots)]

    const availableSlots = uniqueSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }))

    return success(res, { doctor, slots: availableSlots })
  } catch (err) {
    next(err)
  }
}

// ─── Promotions (public-facing) ───────────────────────────────────────────────
const getPromotions = async (req, res, next) => {
  try {
    const data = await prisma.promotion.findMany({
      where: { active: true },
      include: { hospital: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return success(res, data)
  } catch (err) { next(err) }
}

// ─── Hospital Signup Request (public) ─────────────────────────────────────────
const registerHospital = async (req, res, next) => {
  try {
    const { name, city, address, phone, email, beds, type, contact, note } = req.body

    const existing = await prisma.hospitalSignupRequest.findFirst({
      where: { email, status: 'pending' },
    })
    if (existing) return error(res, 'A request with this email is already pending', 409)

    const req2 = await prisma.hospitalSignupRequest.create({
      data: { name, city, address, phone, email, beds: beds ? parseInt(beds) : null, type, contact, note },
    })

    // Notify admin
    await prisma.notification.create({
      data: {
        isAdmin: true,
        type: 'signup',
        icon: '🏥',
        title: 'New Hospital Signup Request',
        msg: `${name}, ${city} has applied to join Heal Focus.`,
      },
    })

    return success(res, req2, 'Signup request submitted. Admin will review and contact you.', 201)
  } catch (err) { next(err) }
}

module.exports = {
  getSpecialties,
  getHospitals,
  getDoctors, getDoctorSlots,
  getPromotions,
  registerHospital,
}
