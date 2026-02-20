const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { STATUS_CODES, TEXTS } = require("../../config/constants");
const { generateToken } = require("../../utils/jwtToken");
const { User, Trade, AccountPerformance } = require("../../models");
const bcrypt = require("bcrypt");

const adminLogin = asyncErrorHandler(async (req, res) => {
  console.log("Admin login attempt:", req.body);
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: "Username and password are required",
    });
  }

  const admin = await User.findOne({
    where: {
      name,
      role: "admin",
    },
  });

  if (!admin) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      statusCode: STATUS_CODES.UNAUTHORIZED,
      message: "Invalid username or password",
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      statusCode: STATUS_CODES.UNAUTHORIZED,
      message: "Invalid username or password",
    });
  }

  const adminData = admin.toJSON();
  delete adminData.password;

  const accessToken = generateToken(adminData);

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.APPVOVED_REQUEST,
    data: adminData,
    accessToken,
  });
});

const adminSignup = asyncErrorHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: "Name, email, and password are required",
    });
  }

  const existingEmail = await User.findOne({
    where: { email },
    paranoid: false,
  });

  if (existingEmail) {
    return res.status(STATUS_CODES.CONFLICT).json({
      statusCode: STATUS_CODES.CONFLICT,
      message: "Email already in use",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "admin",
    accountStatus: "active",
  });

  res.status(STATUS_CODES.CREATED).json({
    statusCode: STATUS_CODES.CREATED,
    message: "Admin account created successfully",
  });
});

const create = asyncErrorHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(STATUS_CODES.CONFLICT).json({
      statusCode: STATUS_CODES.CONFLICT,
      message: "Access denied. Admins only.",
    });
  }

  const {
    accountID,
    name,
    contactInfo,
    broker,
    role,
    licenseTier,
    accountStatus,
  } = req.body;

  if (!accountID || !name || !contactInfo) {
    return res.status(STATUS_CODES.CONFLICT).json({
      statusCode: STATUS_CODES.CONFLICT,
      message: "accountID, name, and contactInfo are required",
    });
  }

  // Check for existing user INCLUDING soft-deleted ones
  const existingUser = await User.findOne({
    where: { accountID },
    paranoid: false
  });

  let user;

  if (existingUser) {
    if (!existingUser.deleted) {
      // User exists and is currently active
      return res.status(STATUS_CODES.CONFLICT).json({
        statusCode: STATUS_CODES.CONFLICT,
        message: "accountID already used and active.",
      });
    } else {
      // User exists but was soft-deleted: RESTORE and UPDATE
      await existingUser.restore();
      user = await existingUser.update({
        name,
        contactInfo,
        role: role || "user",
        broker: broker || null,
        licenseTier: licenseTier || "free",
        accountStatus: accountStatus || "active",
        deleted: null
      });
    }
  } else {
    // User does not exist at all: CREATE new
    user = await User.create({
      accountID,
      name,
      contactInfo,
      role: role || "user",
      broker: broker || null,
      licenseTier: licenseTier || "free",
      accountStatus: accountStatus || "active",
    });
  }

  const existingPerformance = await AccountPerformance.findOne({
    where: { accountID: user.accountID },
    paranoid: false
  });

  if (existingPerformance) {
    if (existingPerformance.deleted) {
      await existingPerformance.restore();
    }
  } else {
    await AccountPerformance.create({
      accountID,
    });
  }

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: existingUser && existingUser.deleted ? "User Restored Successfully" : TEXTS.CREATED,
    data: user,
  });
});

const get = asyncErrorHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      statusCode: STATUS_CODES.FORBIDDEN,
      message: "Access denied. Admins only.",
    });
  }

  const users = await User.findAll({
    where: { role: "user", deleted: null }
  });

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.SUCCESS,
    data: users,
  });
});

const getDemoUsers = asyncErrorHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      statusCode: STATUS_CODES.FORBIDDEN,
      message: "Access denied. Admins only.",
    });
  }

  const users = await User.findAll({
    where: { role: "user", account: "demo", deleted: null },
    ...req.pagination,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.SUCCESS,
    data: users,
  });
});
const getLiveUsers = asyncErrorHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      statusCode: STATUS_CODES.FORBIDDEN,
      message: "Access denied. Admins only.",
    });
  }

  const users = await User.findAll({
    where: { role: "user", account: "live", deleted: null },
    ...req.pagination,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.SUCCESS,
    data: users,
  });
});

const getOne = asyncErrorHandler(async (req, res) => {
  const { accountID } = req.params;
  const user = await User.findOne({
    where: { accountID, role: "user", deleted: null },
  });

  if (!user) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      statusCode: STATUS_CODES.NOT_FOUND,
      message: "User not found",
    });
  }
  const latestTrade = await Trade.findOne({
    where: { accountID },
    order: [['tradeID', 'DESC']],
  });

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.SUCCESS,
    data: user,
    lastTradeID: latestTrade ? latestTrade.tradeID : null
  });
});

const getOnemt = asyncErrorHandler(async (req, res) => {
  const { accountID } = req.params;
  const user = await User.findOne({
    where: { accountID, role: "user", deleted: null },
  });

  if (!user) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      statusCode: STATUS_CODES.NOT_FOUND,
      message: "User not found",
    });
  }
  await user.update({ botLastActive: new Date() });

  const latestTrade = await Trade.findOne({
    where: { accountID },
    order: [['tradeID', 'DESC']],
  });

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.SUCCESS,
    data: user,
    lastTradeID: latestTrade ? latestTrade.tradeID : null
  });
});

const update = asyncErrorHandler(async (req, res) => {
  const { accountID } = req.params;
  const { name, contactInfo, broker, role, licenseTier, accountStatus, account } =
    req.body;

  const user = await User.findOne({ where: { accountID, deleted: null } });
  if (!user) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      statusCode: STATUS_CODES.NOT_FOUND,
      message: "User not found",
    });
  }

  if (user.role === "admin") {
    return res.status(STATUS_CODES.CONFLICT).json({
      statusCode: STATUS_CODES.CONFLICT,
      message: "Cannot update another admin",
    });
  }

  const [rowsUpdated, [updatedUser]] = await User.update(
    {
      name: name || user.name,
      contactInfo: contactInfo || user.contactInfo,
      role: role || user.role,
      broker: broker !== undefined ? broker : user.broker,
      licenseTier: licenseTier || user.licenseTier,
      accountStatus: accountStatus || user.accountStatus,
      account: account || user.account,
    },
    {
      where: { accountID },
      returning: true,
    }
  );

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: TEXTS.UPDATED,
    data: updatedUser,
  });
});

const del = asyncErrorHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(STATUS_CODES.CONFLICT).json({
      statusCode: STATUS_CODES.CONFLICT,
      message: "Access denied. Admins only.",
    });
  }

  const { id } = req.params;

  const result = await User.destroy({
    where: { id },
    force: true
  });

  if (!result) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      statusCode: STATUS_CODES.NOT_FOUND,
      message: "User not found",
    });
  }

  res.status(STATUS_CODES.SUCCESS).json({
    statusCode: STATUS_CODES.SUCCESS,
    message: "User permanently removed from the system",
    data: { id, deletedAt: new Date() },
  });
});

module.exports = {
  adminLogin,
  adminSignup,
  create,
  get,
  getOne,
  update,
  del,
  getDemoUsers,
  getLiveUsers,
  getOnemt
};
