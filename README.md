# SkillPathAI 🚀
**AI-powered Career Roadmap & Skill Tracking Platform**

SkillPathAI is a smart web application built to help students and early professionals gain clarity in their career journey. Instead of generic learning advice, it provides structured roadmaps, skill tracking, and project-based progress insights aligned with real career goals.

This project is developed as part of **Ingenious 7.0 Hackathon** by **Team NEXUS**.

---

## 🧠 Problem Statement

Students today face multiple challenges while preparing for careers:

- Information overload from online platforms
- No clear, structured roadmap aligned with job roles
- Difficulty identifying skill gaps
- Lack of visibility into real progress
- Disconnected learning and project experience

Most platforms focus on content delivery, not **career readiness**.

---

## 💡 Solution & Approach

SkillPathAI solves this problem by acting as a **career intelligence layer** on top of a student's learning journey.

### Our approach:
- Collect user data (skills, projects, career goal)
- Organize progress into structured phases
- Continuously track readiness toward a target role
- Present insights via a clean, professional dashboard

The result is **measurable career clarity**, not guesswork.

---

## ✨ Key Features

### 🔐 Authentication
- Secure login using Google & GitHub authentication
- Firebase Authentication integration

### 📊 Intelligent Dashboard
- Career readiness overview
- Skill progress visualization
- Roadmap phase tracking
- Centralized career data

### 🧩 Skills Management
- Add and manage technical skills
- Automatic progress recalculation
- Structured skill categorization

### 📁 Project Tracking
- Add personal projects
- Link projects to skills
- Track completion and relevance

### 🗺️ Career Roadmap
- Phase-wise roadmap generation
- Clear learning progression toward a role
- Beginner → Intermediate → Advanced structure

---

## 🛠️ Tech Stack

### Frontend
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

### Backend / Services
- **Firebase Authentication**
- **Firebase Firestore**
- **Gemini API** (for AI-powered logic and analysis)

### Hosting
- **Vercel** (planned for deployment)

---

## 🧩 System Architecture (High-Level)

- **Client:** Next.js frontend
- **Authentication:** Firebase Auth (Google / GitHub)
- **Database:** Firestore for user data (skills, projects, roadmap)
- **AI Layer:** Gemini API for intelligent logic
- **Deployment:** Vercel

---

## 🚀 Getting Started (Run Locally)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/khatribhavesh05/Team-NEXUS.git
cd Team-NEXUS
```

### 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ 🔐 Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# Firebase (Public – required for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API (Server-side only)
GEMINI_API_KEY=your_gemini_api_key

⚠️ Important
	•	No secrets are committed to this repository
	•	.env.local is ignored via .gitignore

```

### 4️⃣ Run the Application

```bash
npm run dev
```

Open in browser: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

- Authentication works via Google & GitHub
- Users can sign in and access dashboard
- Skills, projects, and roadmap features are available post-login

---

## 🔮 Future Scope

- 🤖 AI career assistant chatbot
- 📈 Advanced analytics & career predictions
- 🎓 Mentor–mentee integration
- 🧠 Personalized recommendations using AI
- 🌐 GitHub & LinkedIn profile intelligence

---

## 📂 Referenced Repository

This repository is the official submission for **Ingenious 7.0 Hackathon**.

**GitHub Repo:** [https://github.com/khatribhavesh05/Team-NEXUS](https://github.com/khatribhavesh05/Team-NEXUS)

---

## 👥 Team Details

**Team Name:** NEXUS

**Team Members:**
- **Bhavesh Khatri** (Team Lead)
  - Email: bhaveshkhatri1357@gmail.com
- **Akshit Dadhich**

**Institute:** JIET Jodhpur  
**Program:** B.Tech (CSE – AI/ML), 2nd Year

---

## 🔐 Security Confirmation

- No API keys or secrets are committed
- All sensitive data is managed via environment variables
- Firebase security rules are applied

---

Thank you for reviewing SkillPathAI 🙌
