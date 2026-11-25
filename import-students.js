
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const csv = require("csv-parser");
const fs = require("fs");

const serviceAccount = require(
  "D:/FirebaseKeys/bdu-library-account-finder-firebase-adminsdk-fbsvc-5bd75ebd45.json"
);

const csvFile = "D:/FirebaseKeys/BDU_Section7_Records.csv..csv";

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importStudents() {
  const students = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv({
        mapHeaders: ({ header }) =>
          header.replace(/^\uFEFF/, "").trim().toLowerCase()
      }))
      .on("data", row => students.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let batch = db.batch();
  let count = 0;

  for (const student of students) {
    const fullName = student["full name"]?.trim();
    const studentID = student["student id"]?.trim();
    const username = student["library username"]?.trim();
    const password = student["library password"]?.trim();

    if (!fullName || !studentID || !username || !password) {
      console.log("A row has missing information. Skipping it.");
      continue;
    }

    const ref = db.collection("students").doc(studentID);

    batch.set(ref, {
      fullName,
      studentID,
      username,
      password
    });

    count++;

    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % 450 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully imported ${count} students!`);
}

importStudents().catch(error => {
  console.error("Import failed:", error);
});


