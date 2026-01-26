const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name must be at most 100 characters",
      "any.required": "Name is required",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),

  role: Joi.string()
    .valid("user", "admin")
    .default("user")
    .messages({
      "any.only": "Role must be either 'user' or 'admin'",
      "string.base": "Role must be a string",
    }),

  broker: Joi.string()
    .allow(null, "")
    .messages({
      "string.base": "Broker must be a string",
    }),

  licenseTier: Joi.string()
    .valid("free", "basic", "premium", "enterprise")
    .default("free")
    .messages({
      "any.only": "License Tier must be one of 'free', 'basic', 'premium', 'enterprise'",
      "string.base": "License Tier must be a string",
    }),

  accountStatus: Joi.string()
    .valid("active", "paused", "revoked")
    .default("active")
    .messages({
      "any.only": "Account Status must be one of 'active', 'paused', 'revoked'",
      "string.base": "Account Status must be a string",
    }),
});

module.exports = createUserSchema;
