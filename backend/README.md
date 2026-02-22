# 📊 Feedback Forms Backend & Database Setup (MERN)

## 👩‍💻 Database & Backend Setup — Overview

This backend implements the core database and API structure for the **Feedback Forms MERN project**.
It enables event creation, feedback storage, and supports future analytics dashboards.

The backend is built using:

* Node.js + Express
* MongoDB (local Compass for development)
* Mongoose (schema modeling)

---

# 🧠 Database Design Approach

The system is designed using a **structured relational flow inside MongoDB**:

```
User → Event → Feedback Form → Questions → Responses → Analytics
```

Each layer is separated for scalability and analytics performance.

---

# 🗂 Collections Created

## 1. Users Collection

Supports:

* Google OAuth login
* Email + password login

Fields:

* name
* email
* password (for local login)
* googleId (for Google login)
* authProvider (google/local)
* createdAt

Passwords are hashed using bcrypt before storing.

---

## 2. Events Collection (Core of System)

Each logged-in user can create multiple events/courses.

Fields:

* title
* description
* createdBy (User reference)
* publicLink (shareable feedback link)
* isActive (open/close feedback)
* createdAt

Index added on:

```
createdBy
```

for faster dashboard queries.

---

## 3. Feedback Form Collection

Each event has **one feedback form**.

Contains:

* eventId reference
* embedded questions array

Question structure:

* questionText
* type (rating/text)
* required (true/false)

Questions embedded for fast retrieval and analytics.

---

## 4. Responses Collection (Analytics Engine)

Stores all public feedback submissions.

Fields:

* eventId
* answers array:

  * rating (1–5)
  * optional text
* submittedAt

Indexes added:

```
eventId
submittedAt
```

This enables fast analytics queries like:

* average rating
* total responses
* rating distribution
* dashboard charts

---

# ⚙ Backend API Implemented

## Event Creation API

Allows logged-in users to create events.

**POST**

```
/api/events/create
```

Body example:

```
{
  "title": "AI Workshop",
  "description": "Feedback for AI session",
  "createdBy": "USER_ID"
}
```

This creates event and generates public feedback link.

---

## Get Events of User

Fetch all events created by specific user.

**GET**

```
/api/events/user/:userId
```

Used for dashboard event listing.

---

# 🗄 Database Connection

Currently using:

```
Local MongoDB Compass (mongodb://127.0.0.1:27017/feedbackDB)
```

Reason:

* Stable for development
* Avoids network/DNS issues
* Atlas can be connected later for deployment

---

# 📈 Ready for Analytics Team

The database structure supports:

* Total responses per event
* Average rating
* Rating distribution charts
* Time-based analytics
* Dashboard integration

Analytics can be built directly from `responses` collection using aggregation pipelines.

---

# 🔐 Security & Best Practices

* Password hashing implemented
* .env ignored from GitHub
* node_modules removed from repo
* Indexed fields for performance
* Clean schema relationships

---

# 🧩 Next Integration Steps (Team)

Backend is ready for full integration.

---

# 👩‍💻 Author (Database & Backend Setup)

Database schemas, indexing strategy, and initial event APIs designed and implemented for scalable analytics-ready architecture.
