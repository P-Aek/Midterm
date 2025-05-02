const prisma = require("../Config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.Register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ตรวจสอบ  email, password
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // // Validate email format
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //     return res.status(400).json({ message: "Invalid email format" });
    // }

    // Check password strength (minimum 6 characters)
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // ตรวจสอบว่า email มีอยู่แล้วหรือยัง
    const userExists = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // เข้ารหัส password
    const normalizedEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่ (username และ roles ไม่ต้องใส่)
    const newUser = await prisma.users.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        // roles จะ default เป็น "user" ตาม schema
      },
    });

    // ส่ง response กลับ
    res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        roles: newUser.roles,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // ตรวจสอบ email และ password
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // ค้นหาผู้ใช้จาก email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // ตรวจสอบ password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // สร้าง payload สำหรับ JWT
    const payload = {
      user_id: user.user_id,
      email: user.email,
      roles: user.roles,
    };
    // สร้าง JWT token
    if (!process.env.SECRET_KEY) {
      return res
        .status(500)
        .json({ message: "Server error: SECRET_KEY is not defined" });
    }
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1d", // กำหนดเวลาในการหมดอายุของ token
    });
    // ส่ง response กลับ
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.Logout = (req, res) => {
  try {
    // เข้าถึง token จาก header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // ลบ token จาก header
    res.clearCookie("jwt"); // ถ้าใช้ cookie
    // หรือ res.setHeader('Authorization', ''); // ถ้าใช้ header

    res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.CurrentUser = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: {
        email: req.user.email,
      },
      select: {
        user_id: true,
        email: true,
        name: true,
        roles: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("CurrentUser error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.UpdatePassword = async (req, res) => {
  try {
    // {email,oldPassword, newPassword}
    const { email, oldPassword, newPassword } = req.body;
    // check oldPassword and newPassword
    if (!email || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, old password and new password are required" });
    }
    // check newpassword that not same old password
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from old password" });
    }
    // check password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }
    // check email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // compare old password and new password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid old password" });
    }
    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // update password
    const updatedUser = await prisma.users.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });
    // send response
    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("UpdatePassword error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.RecieveOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    // check email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // to prevent users from having multiple active OTPs simultaneously
    try {
      await prisma.otp.deleteMany({
        where: {
          user_id: user.user_id,
          expiresAt: {
            gt: new Date(), // delete OTPs that are not expired
          },
        },
      });
      console.log("Deleted old OTPs successfully");
    } catch (error) {
      console.error("Error deleting old OTPs:", error);
      return res.status(500).json({ message: "Error deleting old OTPs" });
    }

    // generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    // save OTP to database
    await prisma.otp.create({
      data: {
        user_id: user.user_id,
        otp: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 5 minutes
      },
    });
    // send OTP to email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    };
    // send email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Error sending email" });
    }
  } catch (error) {
    console.error("RecieveOTP error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.VerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!otp || !email) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    // check email
    const normalizedEmail = (email || "").toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // check OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        user_id: user.user_id,
        otp: otp,
        expiresAt: {
          gt: new Date(), // check if OTP is not expired
        },
      },
    });
    if (!otpRecord) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    // delete OTP after verification
    await prisma.otp.delete({
      where: { id: otpRecord.id },
    });
    // send response
    res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("VerifyOTP error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
