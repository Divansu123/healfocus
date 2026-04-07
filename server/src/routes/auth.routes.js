const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/auth.controller");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  ctrl.register,
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role")
      .isIn(["patient", "hospital", "admin"])
      .withMessage("Valid role is required"),
  ],
  validate,
  ctrl.login,
);

router.post("/refresh", ctrl.refresh);

router.post("/logout", ctrl.logout);

router.get("/me", authenticate, ctrl.me);

module.exports = router;
