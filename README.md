# Code Arena

A competitive coding platform for real-time multiplayer games and solo practice. Built with Next.js, PostgreSQL, Prisma, Clerk, and Socket.IO, and powered by Judge0 for code execution.

## What this project demonstrates

- Real-time multiplayer coding rooms and games
- Practice mode with submissions and evaluations
- Leaderboards, scoring, and game results
- Room lifecycle management (create, join, start, end)
- External code execution service integration
- Authenticated experiences and protected routes

## High-level architecture (interview-friendly)

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: Next.js API routes for game flow, submissions, and rooms
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Realtime**: Socket.IO server + client hooks
- **Code execution**: Judge0 CE via RapidAPI

## Key flows (logical overview)

1. **User authentication**
   - Users authenticate via Clerk and access protected pages and APIs.

2. **Room creation and joining**
   - A user creates a room, receives a join code, and others join by code.
   - Room state and participants are tracked in the database.

3. **Game start and live updates**
   - The host starts the game, the question is assigned, and a timer begins.
   - Socket.IO broadcasts events such as participant changes and status updates.

4. **Code submission and evaluation**
   - Submissions are sent to Judge0 for execution.
   - Results are stored and used to compute scores and rankings.

5. **Game end and results**
   - Results are aggregated and displayed in a leaderboard view.

## Interview question prompts (from this project)

### System design (high-level)

- How would you design a real-time coding game platform with rooms and leaderboards?
- How do you separate responsibilities between the web app, database, and realtime server?
- What trade-offs come with using Next.js API routes as the backend layer?

### Backend and data modeling

- How do you model rooms, participants, questions, submissions, and results?
- What indexes or constraints are important for room codes and user participation?
- How do you ensure a user cannot join the same room twice?
- How do you handle game status transitions (created → active → ended)?

### Realtime communication

- Why use Socket.IO for live updates instead of polling?
- What events would you emit for room lifecycle and scoreboard updates?
- How do you handle disconnects and stale room state?

### External service integration (Judge0)

- Why use a hosted code execution API instead of running containers locally?
- How do you handle timeouts, memory limits, and error states from Judge0?
- How do you map Judge0 responses to user-visible verdicts?

### Authentication and authorization

- How does Clerk integrate with Next.js for protected routes and API access?
- Where do you enforce access control (pages vs APIs)?

### Performance and scalability

- Which parts of the system are most sensitive to latency?
- How would you scale realtime communication as usage grows?
- What caching or rate-limiting would you add for code submissions?

### Reliability and observability

- What logs and metrics are most useful for tracking game stability?
- How would you debug issues in code execution or realtime events?

### Security and abuse prevention

- How do you prevent spam submissions or room abuse?
- What data validation is necessary for submissions and room actions?
- How do you protect API routes from unauthorized access?

## Supported languages (Judge0 CE)

- JavaScript (Node.js 18.15.0)
- Python (3.8.1)
- C++ (GCC 9.2.0)
- Java (OpenJDK 13.0.1)
- C (GCC 9.2.0)

## Environment variables (summary)

- `RAPIDAPI_KEY` — Judge0 CE API key
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key

## Local setup (short)

1. Install dependencies
   - `npm install`
2. Generate Prisma client and apply schema
   - `npx prisma generate`
   - `npx prisma db push`
3. Run the dev server
   - `npm run dev`

## Project structure (selected)

- app/api — game, room, submission, and question endpoints
- app/rooms — room UI and live game screens
- app/practice — practice mode UI
- lib — Prisma, auth, Judge0, and utilities
- prisma — schema and migrations

## Notes for interviews

- Keep answers high-level and focus on **flows**, **data**, and **system boundaries**.
- Frontend detail is minimal; backend reasoning and real-time flow are stronger talking points.
