const router = require("express").Router();
const telegramServices = require("../../services/telegram/index");


router.post("/telegram/login", telegramServices.loginAccount); 
router.post("/telegram/verify", telegramServices.verifyAccount); 
router.post("/telegram/join/group", telegramServices.joinGroup); 
 



module.exports = router;