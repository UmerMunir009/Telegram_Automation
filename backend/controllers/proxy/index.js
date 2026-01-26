const router = require("express").Router();
const proxyServices = require("../../services/proxy/index");


router.post("/proxy/add", proxyServices.addProxies); 
router.get("/proxy/get", proxyServices.getAvailableProxies);   
router.delete("/proxy/delete/:id", proxyServices.deleteProxy);   



module.exports = router;