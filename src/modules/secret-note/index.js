const express = require("express");
const router = require('express').Router()
const Controller = require('./controller')
const authentication = require("../../middleware/authMiddleware");
const rateLimit = require("express-rate-limit")

const decryptLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 5,
  message: "Too many decryption attempts. Try again later."
});

router.post("/", authentication, Controller.createSecretNote);
router.get("/", authentication, Controller.getSecretNotes);
router.post("/:id/decrypt", authentication, decryptLimiter, Controller.decryptSecretNote);
router.delete("/:id/delete", authentication, Controller.deleteSecretNote);
router.put("/:id/update", authentication, Controller.updateSecretNote);

module.exports = router;
