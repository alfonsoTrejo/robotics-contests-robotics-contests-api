# RCMS API Documentation

Base URL: http://localhost:8080/api

All JSON responses follow:
- Success: { "ok": true, "data": ... }
- Error: { "ok": false, "error": { "message": string } }

Auth is via httpOnly cookie set on login.
Cookie name: rcms_token (or COOKIE_NAME env)

Roles:
- ADMIN
- STUDENT

---

## Auth

### POST /auth/register
Create admin (local) for bootstrap.
Role: Public

Request body:
{
  "name": "Admin",
  "email": "admin@rcms.com",
  "password": "secret"
}

Response 201:
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@rcms.com",
    "role": "ADMIN",
    "authProvider": "LOCAL",
    "createdAt": "2026-02-26T00:00:00.000Z"
  }
}

### POST /auth/login
Login admin (local).
Role: Public

Request body:
{
  "email": "admin@rcms.com",
  "password": "secret"
}

Response 200:
{
  "ok": true,
  "data": { "id": "uuid", "role": "ADMIN", "email": "admin@rcms.com" }
}

### POST /auth/google
Login student via Google id_token.
Role: Public

Request body:
{
  "id_token": "GOOGLE_ID_TOKEN"
}

Response 200:
{
  "ok": true,
  "data": { "id": "uuid", "role": "STUDENT", "email": "student@rcms.com" }
}

### GET /auth/me
Get current user.
Role: ADMIN, STUDENT

Response 200:
{
  "ok": true,
  "data": { "id": "uuid", "role": "STUDENT", "email": "student@rcms.com" }
}

### POST /auth/logout
Clear auth cookie.
Role: ADMIN, STUDENT

Response 200:
{
  "ok": true,
  "data": { "loggedOut": true }
}

---

## Contests

### GET /contests
List contests.
Role: Public

Response 200:
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "title": "Contest 1",
      "description": "...",
      "date": "2026-03-01T10:00:00.000Z",
      "location": "Lab",
      "status": "OPEN"
    }
  ]
}

### GET /contests/:id
Get contest by id.
Role: Public

Response 200:
{
  "ok": true,
  "data": {
    "id": "uuid",
    "title": "Contest 1",
    "description": "...",
    "date": "2026-03-01T10:00:00.000Z",
    "location": "Lab",
    "status": "OPEN"
  }
}

### POST /contests
Create contest.
Role: ADMIN

Request body:
{
  "title": "Contest 1",
  "description": "...",
  "date": "2026-03-01T10:00:00.000Z",
  "location": "Lab"
}

Response 201: contest object

### PATCH /contests/:id
Update contest.
Role: ADMIN

Request body (partial):
{
  "title": "New title",
  "status": "CLOSED"
}

Response 200: contest object

### DELETE /contests/:id
Delete contest.
Role: ADMIN

Response 200: deleted contest object

---

## Modalities

### GET /modalities
List modalities.
Role: Public

### GET /modalities/:id
Get modality by id.
Role: Public

### GET /modalities/by-contest/:contestId
List modalities for a contest.
Role: Public

### POST /modalities
Create modality.
Role: ADMIN

Request body:
{
  "name": "Sumo",
  "description": "...",
  "contestId": "uuid"
}

### PATCH /modalities/:id
Update modality.
Role: ADMIN

### DELETE /modalities/:id
Delete modality.
Role: ADMIN

---

## Teams

### GET /teams
List teams (filter by contestId or modalityId).
Role: Public

Query params: contestId, modalityId

### GET /teams/:id
Get team by id.
Role: Public

### GET /teams/my
List teams for current student.
Role: STUDENT

### POST /teams
Create team.
Role: STUDENT

Request body:
{
  "name": "Team A",
  "contestId": "uuid",
  "modalityId": "uuid",
  "memberUserIds": ["uuid1", "uuid2"]
}

Rules:
- Max 2 members
- Contest must be OPEN
- Requester must be included in memberUserIds

### DELETE /teams/:id
Delete team.
Role: ADMIN

---

## Winners

### GET /winners/:id
Get winner by id.
Role: Public

### GET /winners/modality/:modalityId
Get winners by modality.
Role: Public

### GET /winners/contest/:contestId
Get winners by contest.
Role: Public

### POST /winners
Assign winner.
Role: ADMIN

Request body:
{
  "teamId": "uuid",
  "modalityId": "uuid",
  "position": "FIRST" | "SECOND" | "THIRD"
}

Rules:
- Team must belong to modality
- Only one winner per position per modality
- Max 3 winners per modality

### PATCH /winners/:id
Update winner position.
Role: ADMIN

Request body:
{
  "position": "SECOND"
}

### DELETE /winners/:id
Delete winner.
Role: ADMIN

---

## Certificates

### GET /certificates/winner/:winnerId
Download certificate PDF for winner.
Role: ADMIN or STUDENT (must be member of the winning team)

Response:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="certificate_<winnerId>.pdf"

---

## History

### GET /history/me
Student history with winners and certificate links.
Role: STUDENT

Response 200:
{
  "ok": true,
  "data": [
    {
      "id": "team-id",
      "name": "Team A",
      "createdAt": "2026-02-26T00:00:00.000Z",
      "contest": { "id": "...", "title": "...", "status": "OPEN" },
      "modality": { "id": "...", "name": "..." },
      "members": [
        { "id": "user-id", "name": "Student", "email": "student@rcms.com" }
      ],
      "winner": {
        "id": "winner-id",
        "position": "FIRST",
        "modalityId": "modality-id",
        "certificateUrl": "/api/certificates/winner/winner-id"
      }
    }
  ]
}

---

## Dev (non-production only)

### POST /dev/fake-students
Create or update fake student users for testing.
Role: Public (disabled in production)

### POST /dev/login-fake-student
Login as fake student and set auth cookie.
Role: Public (disabled in production)

Request body:
{
  "email": "student1@fake.test"
}
