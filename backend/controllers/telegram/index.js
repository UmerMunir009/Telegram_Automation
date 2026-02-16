const router = require("express").Router();
const telegramServices = require("../../services/telegram/index");


router.post("/telegram/login", telegramServices.loginAccount); 
router.post("/telegram/verify", telegramServices.verifyAccount); 
router.post("/telegram/join/group", telegramServices.joinGroup); 
router.post("/telegram/send-message", telegramServices.sendSingle); 

// --- NEW JOINER ROUTES ---
router.post("/telegram/join/start", telegramServices.startJob); 
router.post("/telegram/join/stop", telegramServices.stopJob); 
router.get("/telegram/join/status", telegramServices.getLatestStatus); 
router.get("/telegram/join/job/:id", telegramServices.getJobDetails);
 



module.exports = router;