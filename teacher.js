// teacher.js
import { auth, db } from "./firebase.js";
import {
  query,
  collection,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showMessage, logAction } from "./app.js";

const apptDiv = document.getElementById("appts");

auth.onAuthStateChanged((user) => {
  if (!user) {
    apptDiv.innerHTML = "<p>Please login as a teacher.</p>";
    return;
  }

  const q = query(
    collection(db, "appointments"),
    where("teacherId", "==", user.uid),
    orderBy("startTime", "desc")
  );

  onSnapshot(q, (snap) => {
    if (snap.empty) {
      apptDiv.innerHTML = "<p>No appointments found.</p>";
      return;
    }

    apptDiv.innerHTML = snap.docs
      .map((d) => {
        const a = d.data();
        const start = new Date(a.startTime.seconds * 1000).toLocaleString();
        return `
        <div class="card">
          <h3>${a.studentName}</h3>
          <p>${start}</p>
          <p>Status: <strong>${a.status}</strong></p>
          <button class="approve" data-id="${d.id}">Approve</button>
          <button class="cancel" data-id="${d.id}">Cancel</button>
        </div>`;
      })
      .join("");

    document.querySelectorAll(".approve").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "appointments", btn.dataset.id), {
            status: "approved",
          });
          await logAction("approve_appt", btn.dataset.id);
          showMessage("Appointment approved");
        } catch (err) {
          showMessage("❌ " + err.message, true);
        }
      })
    );

    document.querySelectorAll(".cancel").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "appointments", btn.dataset.id), {
            status: "cancelled",
          });
          await logAction("cancel_appt", btn.dataset.id);
          showMessage("Appointment cancelled");
        } catch (err) {
          showMessage("❌ " + err.message, true);
        }
      })
    );
  });
});
