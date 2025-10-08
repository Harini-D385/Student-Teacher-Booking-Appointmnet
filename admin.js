// admin.js
import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { currentUser, currentRole, showMessage, logAction } from "./app.js";

// Add teacher form
const teacherForm = document.getElementById("teacher-form");
if (teacherForm) {
  teacherForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.tname.value.trim();
    const dept = e.target.dept.value.trim();
    const subjects = e.target.subjects.value.split(",").map((s) => s.trim());
    const bio = e.target.tbio.value.trim();

    try {
      await addDoc(collection(db, "teachers"), {
        name,
        department: dept,
        subjects,
        bio,
        createdAt: new Date(),
      });
      showMessage("✅ Teacher added successfully!");
      await logAction("add_teacher", name);
      e.target.reset();
    } catch (err) {
      console.error(err);
      showMessage("❌ " + err.message, true);
    }
  });
}

// Load pending students for approval
async function loadPending() {
  const tbody = document.querySelector("#pending-table tbody");
  tbody.innerHTML = "<tr><td colspan='3'>Loading…</td></tr>";

  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    const pending = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.role === "student" && !u.approved);

    if (!pending.length) {
      tbody.innerHTML = "<tr><td colspan='3'>No pending students.</td></tr>";
      return;
    }

    tbody.innerHTML = pending
      .map(
        (u) => `
      <tr>
        <td>${u.name || "-"}</td>
        <td>${u.email || "-"}</td>
        <td><button class="approve" data-uid="${u.id}">Approve</button></td>
      </tr>`
      )
      .join("");

    document.querySelectorAll(".approve").forEach((b) =>
      b.addEventListener("click", async () => {
        const uid = b.dataset.uid;
        try {
          await updateDoc(doc(db, "users", uid), { approved: true });
          showMessage("✅ Student approved");
          await logAction("approve_student", uid);
          loadPending();
        } catch (err) {
          showMessage("❌ " + err.message, true);
        }
      })
    );
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='3'>Error loading data.</td></tr>";
  }
}

// Protect the admin page
async function ensureAdmin() {
  await new Promise((r) => setTimeout(r, 800));
  if (!currentUser || currentRole !== "admin") {
    showMessage("Access denied (Admin only)", true);
    setTimeout(() => (window.location.href = "index.html"), 1200);
  } else {
    loadPending();
  }
}

ensureAdmin();
