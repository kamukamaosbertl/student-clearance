import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Handles user login
export const login = async (req, res) => {
  try {
    // Get the login details sent by the client
    const { studentId, password } = req.body;

    // Check that both login fields were provided
    if (!studentId || !password) {
      return res.status(400).json({
        message: "Student ID and password are required.",
      });
    }

    // Normalize the student ID to avoid false negatives from stray whitespace
    const normalizedStudentId = studentId.trim();

    // Find the user by their student ID
    const user = await User.findOne({
      where: { studentId: normalizedStudentId },
    });

    // Use the same message whether the ID or password is incorrect
    // This avoids revealing whether a student ID exists in the system
    if (!user) {
      // Run a dummy comparison so the response takes a similar amount of
      // time whether or not the student ID exists (timing-attack mitigation).
      // Falls back to skipping the comparison if the env var isn't set,
      // rather than throwing on an empty/invalid hash.
      const dummyHash = process.env.DUMMY_BCRYPT_HASH;
      if (dummyHash) {
        await bcrypt.compare(password, dummyHash);
      }

      return res.status(401).json({
        message: "Invalid student ID or password.",
      });
    }

    // Prevent inactive accounts from logging in
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    // Compare the entered password with the stored password hash
    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    // Stop the login if the password is incorrect
    if (!passwordIsCorrect) {
      return res.status(401).json({
        message: "Invalid student ID or password.",
      });
    }

    // Fail fast if the server is misconfigured, rather than issuing a broken token
    if (!process.env.JWT_SECRET) {
      console.error("Login error: JWT_SECRET is not set");
      return res.status(500).json({
        message: "An error occurred during login.",
      });
    }

    // Create a JWT containing only the information needed
    // to identify and authorize the authenticated user
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Return the token and safe user information
    // Never send the password or password hash to the client
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        programme: user.programme,
        faculty: user.faculty,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle unexpected errors without exposing sensitive details
    console.error("Login error:", error);

    return res.status(500).json({
      message: "An error occurred during login.",
    });
  }
};

// Handles officer and admin login (email + password)
export const staffLogin = async (req, res) => {
  try {
    // Get the login details sent by the client
    const { email, password } = req.body;

    // Check that both login fields were provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Normalize the email to avoid case/whitespace mismatches
    const normalizedEmail = email.trim().toLowerCase();

    // Find the user by their email
    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    // Use the same message whether the email or password is incorrect
    // This avoids revealing whether an email exists in the system
    if (!user) {
      // Run a dummy comparison so the response takes a similar amount of
      // time whether or not the email exists (timing-attack mitigation)
      const dummyHash = process.env.DUMMY_BCRYPT_HASH;
      if (dummyHash) {
        await bcrypt.compare(password, dummyHash);
      }

      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Students must use the student login page, not this one
    if (user.role === "student") {
      return res.status(403).json({
        message: "Please use the student login page.",
      });
    }

    // Prevent inactive accounts from logging in
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    // Compare the entered password with the stored password hash
    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    // Stop the login if the password is incorrect
    if (!passwordIsCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Fail fast if the server is misconfigured, rather than issuing a broken token
    if (!process.env.JWT_SECRET) {
      console.error("Staff login error: JWT_SECRET is not set");
      return res.status(500).json({
        message: "An error occurred during login.",
      });
    }

    // Create a JWT containing only the information needed
    // to identify and authorize the authenticated user
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Return the token and safe user information
    // Never send the password or password hash to the client
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle unexpected errors without exposing sensitive details
    console.error("Staff login error:", error);

    return res.status(500).json({
      message: "An error occurred during login.",
    });
  }
};