const path = require("path");
const User = require("../models/User");
const Researcher = require("../models/Researcher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const { parseBool } = require("../validators/authValidators");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/constants");
const authService = require('../services/authService');

/**
 * Register a PARTICIPANT (used for participation/enrollment flow)
 */
const registerParticipant = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    age,
    gender,
    location,
    height,
    weight,
    bloodGroup,
    medicalConditions,
    medications,
    smokingStatus,
    alcoholStatus,
    sleepPatterns,
    activityLevel,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  const user = await User.create({
    name,
    email,
    password, // Hashing now handled by pre-save hook
    role: "participant",
    age,
    gender,
    location,
    height,
    weight,
    bloodGroup,
    medicalConditions,
    medications,
    smokingStatus,
    alcoholStatus,
    sleepPatterns,
    activityLevel,
  });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({
    success: true,
    message: "Participant registered successfully",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * Register a RESEARCHER (submitted for admin review)
 */
const registerResearcher = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    fullName,
    nic,
    gender,
    currentWorkplace,
    highestAcademicQualification,
    researcherType,
    otherResearcherTypeExplanation,
    hasPublishedResearch,
    publicationSiteOrLink,
    purpose,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  const hasPublished = parseBool(hasPublishedResearch);

  const user = await User.create({
    name: name || fullName,
    email,
    password, // Hashing now handled by pre-save hook
    role: "researcher",
  });

  const researcherData = {
    user: user._id,
    fullName: fullName || name,
    nic,
    gender,
    currentWorkplace,
    highestAcademicQualification,
    researcherType,
    hasPublishedResearch: hasPublished === true,
    purpose,
    status: "pending",
  };

  if (researcherType === "Other" && otherResearcherTypeExplanation) {
    researcherData.otherResearcherTypeExplanation = otherResearcherTypeExplanation;
  }
  if (hasPublished === true && publicationSiteOrLink) {
    researcherData.publicationSiteOrLink = publicationSiteOrLink;
  }
  if (req.file && req.file.filename) {
    researcherData.affiliationProof = path.join("affiliation-proofs", req.file.filename);
  }

  const researcher = await Researcher.create(researcherData);

  const populated = await Researcher.findById(researcher._id).populate(
    "user",
    "name email role"
  );

  res.status(201).json({
    success: true,
    message: "Researcher registration submitted for admin review",
    researcher: populated,
  });
});

/**
 * Unifying General User Registration (from fund_management service)
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.registerUser(name, email, password, role);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Login (unifying loginUser from fund_management)
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    res.json(user);
  } catch (error) {
    res.status(401);
    next(error);
  }
};

/**
 * Original Login (Develop_Integration)
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const payload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (user.role === "researcher") {
    const researcher = await Researcher.findOne({ user: user._id });
    payload.researcherStatus = researcher ? researcher.status : null;
  }

  res.status(200).json({
    success: true,
    token,
    user: payload,
  });
});

module.exports = {
  registerParticipant,
  registerResearcher,
  registerUser,
  login,
  loginUser,
};
