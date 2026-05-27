# 🔁 Skill Swap Platform

A full-stack + blockchain-based web application that allows users to exchange skills with each other — teach one skill and learn another in return.

This project includes smart skill matching, user authentication, and blockchain integration using Solidity.

---

## 🌐 Live Demo

👉 https://skill-swap-eight-beryl.vercel.app/

---

## 📌 About the Project

Skill Swap is designed to connect people who want to learn new skills by exchanging their own skills.  
Example:  
- A user who knows “React” can teach it  
- In return, they can learn “Python” from someone else  

The platform matches users based on their skills and interests.

---

## 🚀 Features

- 👤 User registration and login system
- 🔍 Add skills to “Teach” and “Learn”
- 🤝 Smart skill matching between users
- 🔗 Blockchain-based smart contract integration (Solidity)
- 🔄 Two-way skill exchange system
- 📱 Fully responsive UI (mobile + desktop)
- ⚡ Fast and deployed web application
- ☁️ Frontend deployed on Vercel

---

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- HTML/CSS

### Backend
- Node.js
- Express.js

### Blockchain
- Solidity
- Smart Contracts

### Tools & Deployment
- GitHub
- Vercel

---

## 📁 Project Structure
skill-swap/
│
├── frontend/
│   ├── src/
│   └── public/
│
├── backend/
│   ├── routes/
│   ├── models/
│   └── index.js
│
├── blockchain/
│   └── contracts/
│
└── README.md

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/sangee2403/skill-swap.git
cd skill-swap

2️⃣ Setup Frontend
cd frontend
npm install
npm start

3️⃣ Setup Backend
cd backend
npm install
node server.js

🔐 Environment Variables

Create a .env file inside backend folder:

# Server port
PORT=5000

# PostgreSQL database connection
DATABASE_URL=postgresql://username:password@host:5432/databasename

# JWT secret for authentication
JWT_SECRET=your_secret_key
