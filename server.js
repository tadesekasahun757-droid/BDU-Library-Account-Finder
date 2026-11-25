
const express = require("express");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const serviceAccount = require(
  "D:/FirebaseKeys/bdu-library-account-finder-firebase-adminsdk-fbsvc-5bd75ebd45.json"
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.use(express.json());
app.use(express.static(__dirname));

app.post("/search", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const studentID = String(req.body.studentID || "").trim();

    if (!fullName || !studentID) {
      return res.status(400).json({
        success: false,
        message: "Enter your full name and student ID."
      });
    }

    const doc = await db.collection("students").doc(studentID).get();

    if (!doc.exists) {
      return res.json({
        success: false,
        message: "No matching student account found."
      });
    }

    const student = doc.data();

    if (student.fullName.toLowerCase() !== fullName.toLowerCase()) {
      return res.json({
        success: false,
        message: "The full name and student ID do not match."
      });
    }

    res.json({
      success: true,
      username: student.username,
      password: student.password
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
