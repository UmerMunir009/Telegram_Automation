const router = require("express").Router();
const userServices = require("../../services/user/index");


router.post("/admin-login",userServices.adminLogin); 
// router.post("/user/create", userServices.create);   
router.get("/user/get", userServices.get);   
// router.get("/user/get/demo", userServices.getDemoUsers);   
// router.get("/user/get/live", userServices.getLiveUsers);   
// router.get("/user/get/:accountID", userServices.getOne);   
// router.get("/user/mt/:accountID", userServices.getOnemt);   
router.delete("/user/:id", userServices.del);   
// router.patch("/user/:accountID", userServices.update);   
// router.post("/user/:accountID", userServices.update);   
router.post("/admin-signup",userServices.adminSignup); 


module.exports = router;