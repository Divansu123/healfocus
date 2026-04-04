const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/admin.controller");

router.post("/createAdmin", ctrl.createAdmin);

router.post("/createHospital", ctrl.createHospital);

// All admin routes require auth + admin role
router.use(authenticate, authorize("admin"));

// ─── Overview ─────────────────────────────────────────────────────────────────
router.get("/overview", ctrl.getOverview);

// ─── Hospitals ────────────────────────────────────────────────────────────────
router.get("/hospitals", ctrl.getHospitals);
router.patch(
  "/hospitals/:id/status",
  [body("status").notEmpty().withMessage("status required")],
  validate,
  ctrl.updateHospitalStatus,
);

// ─── Hospital Signup Requests ─────────────────────────────────────────────────
router.get("/onboarding", ctrl.getSignupRequests);
router.post("/onboarding/:id/approve", ctrl.approveSignupRequest);
router.post("/onboarding/:id/reject", ctrl.rejectSignupRequest);

// ─── Patients ─────────────────────────────────────────────────────────────────
router.get("/patients", ctrl.getPatients);

// ─── Admissions ───────────────────────────────────────────────────────────────
router.get("/admissions", ctrl.getAdmissions);
router.patch(
  "/admissions/:id/status",
  [body("status").notEmpty().withMessage("status required")],
  validate,
  ctrl.updateAdmissionStatus,
);

// ─── Promotions ───────────────────────────────────────────────────────────────
router.get("/promotions", ctrl.getAllPromotions);
router.post(
  "/promotions",
  [body("title").notEmpty().withMessage("title required")],
  validate,
  ctrl.createPromotion,
);
router.put("/promotions/:id", ctrl.updatePromotion);
router.delete("/promotions/:id", ctrl.deletePromotion);

// ─── Service Requests ─────────────────────────────────────────────────────────
router.get("/service-requests", ctrl.getAllServiceRequests);
router.patch("/service-requests/:id", ctrl.updateServiceRequest);

// ─── Team ─────────────────────────────────────────────────────────────────────
router.get("/team", ctrl.getTeamMembers);
router.post(
  "/team",
  [
    body("name").notEmpty().withMessage("name required"),
    body("email").isEmail().withMessage("valid email required"),
    body("role").notEmpty().withMessage("role required"),
  ],
  validate,
  ctrl.addTeamMember,
);
router.put("/team/:id", ctrl.updateTeamMember);
router.delete("/team/:id", ctrl.removeTeamMember);

// ─── Notifications ────────────────────────────────────────────────────────────
router.get("/notifications", ctrl.getNotifications);
router.patch("/notifications/:id/read", ctrl.markNotificationRead);

module.exports = router;
