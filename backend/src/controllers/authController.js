const path = require("path");
const User = require("../models/User");
const Researcher = require("../models/Researcher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const { parseBool } = require("../validators/authValidators");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/constants");

/**
 * Register a PARTICIPANT (used for participation/enrollment flow)
 * - Keeps your feature branch registration idea
 * - Uses Develop_Integration style (asyncHandler + constants)
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

  const hashedPassword = await bcrypt.hash(password, 12);

  // NOTE:
  // If your User schema doesn't include these extra fields, Mongoose (strict mode)
  // will ignore them safely (won't crash). If schema has them, they will be saved.
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
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

  res.status(201).json({
    success: true,
    message: "Participant registered successfully",
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
 * - This is the Develop_Integration flow
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

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name || fullName,
    email,
    password: hashedPassword,
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
 * Login (used for all roles)
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // IMPORTANT: password is select:false in Develop_Integration User model
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
    { userId: user._id, role: user.role }, // include role (helpful + safe)
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
  login,
};