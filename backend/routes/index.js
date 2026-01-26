const router = require("express").Router();

router.use(require('../controllers/user/userController.js'));
router.use(require('../controllers/proxy/index.js'));
router.use(require('../controllers/telegram/index.js'));



module.exports = router;
