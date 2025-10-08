// student.js
import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showMessage, logAction } from "./app.js";

const params = new URLSearchParams(location.search);
const teacherId = params.get("teacherId");
const teacherName = decodeURIComponent(params.get("teacherName") || "");
document.getElementById("teacherId").value = teacherId || "";
document.getElementById("teacher-title").textContent = teacherName
  ? `Booking with ${teacherName}`
  : "Book Appointment";

const form = document.getElementById("book-form");
const apptList = document.getElementById("my-appts");

// Convert datetime-local to Firestore Timestamp object
function toTimestampLocal(value) {
  const d = new Date(value);
  return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
}

// Load student’s appointments (realtime)
function loadMyAppointments() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      apptList.innerHTML = "<p>Please login to view appointments.</p>";
      return;
    }
    const q = query(
      collection(db, "appointments"),
      where("studentId", "==", user.uid),
      orderBy("startTime", "desc")
    );

    onSnapshot(q, (snap) => {
      if (snap.empty) {
        apptList.innerHTML = "<p>No appointments booked yet.</p>";
        return;
      }
      apptList.innerHTML = snap.docs
        .map((d) => {
          const a = d.data();
          const start = new Date(a.startTime.seconds * 1000).toLocaleString();
          return `<div class="card"><strong>${a.teacherName}</strong>
            <p>${start}</p>
            <p>Status: ${a.status}</p></div>`;
        })
        .join("");
    });
  });
}
loadMyAppointments();

// Handle booking
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sVal = e.target.start.value;
  const eVal = e.target.end.value;
  const reason = e.target.reason.value.trim();

  if (!auth.currentUser) {
    showMessage("Please login to book", true);
    return;
  }

  if (!teacherId || !sVal || !eVal) {
    showMessage("Please fill all fields", true);
    return;
  }

  const sDate = new Date(sVal);
  const eDate = new Date(eVal);
  if (sDate >= eDate) {
    showMessage("End time must be after start time", true);
    return;
  }

  try {
    // Conflict check: same teacher, overlapping time
    const q = query(collection(db, "appointments"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    const conflict = snap.docs.some((d) => {
      const a = d.data();
      if (!a.startTime || !a.endTime) return false;
      const aStart = a.startTime.seconds * 1000;
      const aEnd = a.endTime.seconds * 1000;
      return (
        (aStart < eDate.getTime()) &&
        (aEnd > sDate.getTime()) &&
        ["pending", "approved"].includes(a.status)
      );
    });

    if (conflict) {
      showMessage("⚠️ Time conflict with another appointment", true);
      return;
    }

    await addDoc(collection(db, "appointments"), {
      studentId: auth.currentUser.uid,
      studentName: auth.currentUser.displayName || auth.currentUser.email,
      teacherId,
      teacherName,
      startTime: toTimestampLocal(sVal),
      endTime: toTimestampLocal(eVal),
      reason,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    await logAction("book_appointment", `teacher:${teacherName}`);
    showMessage("✅ Appointment request sent!");
    e.target.reset();
  } catch (err) {
    console.error(err);
    showMessage("❌ " + err.message, true);
  }
});
