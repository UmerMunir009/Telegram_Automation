const router = require("express").Router();
const telegramServices = require("../../services/telegram/index");


router.post("/telegram/login", telegramServices.loginAccount); 
router.post("/telegram/verify", telegramServices.verifyAccount); 
router.post("/telegram/join/group", telegramServices.joinGroup); //NOT IN USE NOW
router.post("/telegram/send-message", telegramServices.sendSingle); //NOT IN USE NOW

//  CHANNEL JOINER 
router.post("/telegram/join/start", telegramServices.startJob); 
router.post("/telegram/join/stop", telegramServices.stopJob); 
router.get("/telegram/join/status", telegramServices.getLatestStatus); 
router.get("/telegram/join/job/:id", telegramServices.getJobDetails);


// TELEGRAM CHAT
router.get("/telegram/account/chats/:phone", telegramServices.getAccountChats);
router.get("/telegram/chat/messages/:phone/:chatId", telegramServices.getChatMessages);
router.post("/telegram/chat/send/:phone", telegramServices.sendMessage);

// Mass Messaging 
router.post("/telegram/messages/start", telegramServices.startMessageJob);
router.post("/telegram/messages/stop", telegramServices.stopMessageJob);
router.get("/telegram/messages/all", telegramServices.getAllMessageJobs);
router.get("/telegram/messages/job/:id", telegramServices.getMessageJobDetails);

 



module.exports = router;