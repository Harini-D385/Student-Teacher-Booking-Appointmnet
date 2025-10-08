# Student–Teacher Booking Appointment 

## Pages
- `index.html` — teacher list
- `signup.html`, `login.html` — auth
- `student.html` — booking & my appointments (students)
- `teacher.html` — teacher's appointments (teachers)
- `admin.html` — add teachers / approve students (admin)
- `profile.html` — profile & role info

## Important
- On signup a `users/{uid}` doc is auto-created with `role: student` and `approved: false`.
- Admin must set `users/{uid}.approved = true` for students to book appointments.
