// app.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export let currentUser = null;
export let currentRole = null;
export let currentApproved = false;

// small global message helper
export function showMessage(text = "", isError = false) {
  const el = document.getElementById("global-message");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "crimson" : "green";
  if (text) setTimeout(() => el.textContent = "", 4000);
}

// log actions to Firestore (best effort)
export async function logAction(action, details = "") {
  try {
    await addDoc(collection(db, "logs"), {
      action,
      details,
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      time: serverTimestamp()
    });
  } catch (e) {
    console.warn("logAction failed", e);
  }
}

// create user profile doc on first login/signup
async function ensureUserDoc(user) {
  const uref = doc(db, "users", user.uid);
  const snap = await getDoc(uref);
  if (!snap.exists()) {
    await setDoc(uref, {
      name: user.displayName || "",
      email: user.email || "",
      role: "student",
      approved: false,
      createdAt: serverTimestamp()
    });
    console.log("Created user profile for", user.uid);
  }
}

// update UI links (nav) depending on role
function updateNavUI() {
  const profile = document.getElementById("nav-profile");
  const login = document.getElementById("nav-login");
  const signup = document.getElementById("nav-signup");
  const admin = document.getElementById("nav-admin");
  const teacher = document.getElementById("nav-teacher");
  const student = document.getElementById("nav-student");
  const logout = document.getElementById("nav-logout");

  if (!profile) return;
  if (currentUser) {
    profile.style.display = "inline-block";
    login.style.display = "none";
    signup.style.display = "none";
    logout.style.display = "inline-block";
    if (currentRole === "admin") {
      admin.style.display = "inline-block";
      teacher.style.display = "none";
      student.style.display = "none";
    } else if (currentRole === "teacher") {
      teacher.style.display = "inline-block";
      admin.style.display = "none";
      student.style.display = "none";
    } else if (currentRole === "student") {
      student.style.display = "inline-block";
      admin.style.display = "none";
      teacher.style.display = "none";
    } else {
      admin.style.display = "none";
      teacher.style.display = "none";
      student.style.display = "none";
    }
  } else {
    profile.style.display = "none";
    login.style.display = "inline-block";
    signup.style.display = "inline-block";
    admin.style.display = "none";
    teacher.style.display = "none";
    student.style.display = "none";
    logout.style.display = "none";
  }
}

// sign out helper
export async function doSignOut() {
  try {
    await signOut(auth);
    showMessage("Signed out");
    await logAction("sign_out");
    window.location.href = "login.html";
  } catch (e) {
    showMessage(e.message, true);
  }
}
window.doSignOut = doSignOut;

// Observe auth state & load role + approved flag
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentRole = null;
  currentApproved = false;
  if (user) {
    try {
      await ensureUserDoc(user);
      const uref = doc(db, "users", user.uid);
      const snap = await getDoc(uref);
      if (snap.exists()) {
        const d = snap.data();
        currentRole = d.role || "student";
        currentApproved = !!d.approved;
      } else {
        currentRole = "student";
        currentApproved = false;
      }
    } catch (e) {
      console.error("Failed to get user doc:", e);
      currentRole = "student";
    }
  }
  updateNavUI();
});
