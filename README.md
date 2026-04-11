# HealthLab

HealthLab is a full-stack MERN application designed to support digital health research workflows. The platform helps researchers create and manage experiments, publish research reviews, collaborate with co-researchers, and monitor participant activity, while participants can discover studies, check eligibility, enroll, submit daily logs, and interact through community features.

The repository is organized as a two-part system:

- `backend/` contains the Node.js, Express, and MongoDB API
- `frontend/` contains the React + Vite client application

## Project Overview

**Technology stack**

- Backend: Node.js, Express.js, MongoDB, Mongoose
- Frontend: React, Vite, React Router
- Styling: Tailwind CSS, DaisyUI
- Testing: Jest, Supertest, Artillery
- Architecture: Controller -> Service -> Model

**Core domains**

- Research Reviews
- Experiments
- Co-Researcher collaboration
- Participant enrollment and daily logs
- Recommendations and eligibility analysis
- Fund requests and contributions
- Community and reporting workflows
- Role-based access for Admin, Researcher, and Participant users

## Repository Structure

```text
HealthLab/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- modules/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- server.js
|   `-- testing/
|       |-- integration/
|       |-- performance/
|       `-- unit/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- styles/
|   |   `-- utils/
|   `-- package.json
`-- README.md
```

## Architecture

HealthLab follows a layered backend structure to keep responsibilities separated and maintainable.

### Routes

Route files define API paths, attach middleware, and connect incoming requests to controller functions. In this project, routes are grouped by domain such as authentication, experiments, reviews, participations, admin actions, and community features.

### Controllers

Controllers receive HTTP requests, validate high-level input flow, call service-layer logic, and format HTTP responses. They are responsible for translating business outcomes into proper response payloads and status codes.

### Services

Services contain the core business rules of the application. This includes eligibility checks, matching logic, experiment operations, review workflows, wallet actions, recommendation generation, and co-researcher management.

### Models

Mongoose models define how data is stored in MongoDB. These models capture users, experiments, reviews, participations, contributions, fund requests, posts, and related entities.

### Middleware

Middleware is used for authentication, authorization, request validation, file upload handling, database readiness checks, and centralized error management.

### Config

The `config/` layer handles environment-based application settings such as MongoDB connection logic, JWT constants, and startup configuration.

### Utils

Utility modules provide reusable helpers such as async wrappers, password rules, response helpers, logging, and error utilities.

## Backend API Overview

The backend is mounted under `http://localhost:5000` by default, with most features exposed through `/api/...` routes.

| Domain | Base Path | Endpoints | Description |
|---|---|---:|---|
| Health | `/health` | 1 | API and database health status |
| Auth | `/api/auth` | 6 | Registration, login, profile management, researcher flagging |
| Experiments | `/api/experiments` | 9 | Public experiment listing plus researcher/admin CRUD and summaries |
| Reviews | `/api/reviews` | 5 | Create, read, update, and delete research reviews |
| Co-Researchers | `/experiments/:experimentId/co-researchers` | 4 | Collaborator management for experiments |
| Recommendations | `/api/recommendations` | 1 | Personalized experiment matching for participants |
| Participations | `/api/participations` | 8 | Join, leave, logs, studies, and participant dashboards |
| Fund Requests | `/api/fund-requests` | 7 | Request funding and manage funding lifecycle |
| Contributions | `/api/contributions` | 4 | Participant or admin contribution tracking |
| Payments | `/api/payments` | 4 | Payment creation, status checks, and webhook flow |
| Community | `/api/posts` | 17 | Posts, likes, poll voting, comments, saves, reports, chatbot |
| Admin | `/api/admin` | 24 | Analytics, approvals, moderation, reports, and admin controls |
| External | `/api/external` | 2 | External FDA proxy endpoints |

### Major API Workflows

- **Researcher workflow**: register -> admin approval -> create experiment -> publish review -> manage collaborators and funding
- **Participant workflow**: register -> browse experiments -> view match percentage -> preview eligibility -> enroll -> submit daily logs -> track studies
- **Admin workflow**: approve researchers -> monitor analytics -> review reports -> manage users, experiments, and funding

## Database Models

The backend currently uses the following main Mongoose models.

| Model | Purpose | Key Fields |
|---|---|---|
| `User` | Core identity, authentication, and participant profile data | `name`, `email`, `password`, `role`, `isApproved`, `age`, `gender`, `height`, `weight`, `medicalConditions`, `bmi` |
| `Researcher` | Extended researcher registration and approval workflow | `user`, `fullName`, `nic`, `currentWorkplace`, `highestAcademicQualification`, `researcherType`, `status`, `reviewNotes`, `researcherId` |
| `Experiment` | Research studies and structured eligibility/data collection rules | `title`, `description`, `status`, `eligibilityCriteria`, `participantLimit`, `currentParticipantCount`, `ownerId`, `tags`, `logFieldDefinitions`, `startDate`, `endDate` |
| `Review` | Research review content authored by researchers or admins | `title`, `summary`, `content`, `status`, `authorId`, `keywords`, `experiment`, `publishedAt` |
| `Participation` | Participant enrollment state and daily activity logs | `userId`, `experimentId`, `status`, `dateJoined`, `dateLeft`, `logs` |
| `FundRequest` | Research funding requests created by researchers | experiment reference, requested amount, reason, review status |
| `Contribution` | Contribution history for funding support | contributor identity, amount, request linkage, status |
| `ExperimentWallet` | Budget and wallet tracking for experiments | experiment linkage, balance, transactions |
| `Post` | Community discussions and engagement features | author, content, tags, likes, saves, comments, poll data |
| `Report` | Moderation and abuse-report records | post reference, reporter, reason, review outcome |

### Co-Researcher Representation

Co-researchers are managed through dedicated experiment routes and service logic. In the current codebase, collaborator data is handled as experiment-linked records rather than as a standalone top-level `CoResearcher.js` model file.

## API Documentation

API documentation is currently maintained through the repository documentation and endpoint-oriented testing workflow:

- Backend API reference: [backend/README.md](./backend/README.md)
- Unit, integration, and performance test assets: `backend/testing/`
- Postman can be used to organize request collections for manual verification and demos

At the moment, an embedded Swagger UI route such as `/api-docs` is **not** mounted in the current backend code. If required later, Swagger can be added as a documentation enhancement, but the existing project already provides a route-based API structure and test coverage suitable for academic evaluation.

## Frontend Features

The frontend is implemented with modern React and Vite.

- React functional components with Hooks
- React Router based client-side navigation
- Axios-based API integration through `frontend/src/api/api.js`
- JWT-aware request interceptor for protected API calls
- Tailwind CSS and DaisyUI for UI styling
- Route-aware role-specific pages for participant, researcher, and admin users
- Research-focused pages such as recommendations, studies dashboard, reviews, wallets, fund requests, and community

### Frontend State Management

The current frontend primarily uses hook-based local state and token persistence via `localStorage`. It does not currently rely on Redux, and there is no central React Context store wired as a global state container in the present codebase.

## Authentication and Security

HealthLab includes multiple security-focused backend layers.

- JWT-based authentication for protected endpoints
- Role-based authorization for `admin`, `researcher`, and `participant`
- Protected route middleware for both backend API access and frontend page access patterns
- Researcher approval workflow before publishing restricted content
- Input validation using route validators and schema checks
- Centralized error handling middleware
- Database readiness guard before API route execution
- Optional support for request metadata via headers where needed in some internal flows

**Typical auth format**

```http
Authorization: Bearer <jwt-token>
```

## Testing

HealthLab includes three testing layers in the backend.

### Unit Testing

Unit tests cover service logic, validation utilities, eligibility checks, matching logic, controller behavior with mocks, and other isolated business functions.

### Integration Testing

Integration tests use Jest and Supertest to exercise real API flows against a test-safe environment without relying on the production database.

### Performance Testing

Performance testing uses Artillery YAML scenarios to measure response time, throughput, and stability across safe API flows.

### Test Commands

Run commands from the `backend/` directory.

| Command | Purpose |
|---|---|
| `npm test` | Run the default Jest unit suite |
| `npm run test:unit` | Run unit tests explicitly |
| `npm run test:integration` | Run integration tests |
| `npx jest --coverage --config testing/jest.config.js testing/unit` | Generate unit test coverage report |
| `npm run test:performance` | Run the default Artillery performance scenario |
| `npm run test:performance:low` | Low-load performance test |
| `npm run test:performance:medium` | Medium-load performance test |
| `npm run test:performance:high` | High-load performance test |
| `npm run test:performance:researcher` | Researcher-focused read flow performance test |

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AF_Proj_One
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Environment Variables

Create a `.env` file in `backend/` and configure the values below.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/af_project_db
MONGO_DB_NAME=af_project_db
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Common Backend Variables

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `MONGODB_URI` or `MONGO_URI` | MongoDB connection string |
| `MONGO_DB_NAME` | Database name override |
| `JWT_SECRET` | Token signing secret |
| `JWT_EXPIRES_IN` | JWT lifetime |
| `NODE_ENV` | Runtime environment |
| `GEMINI_API_KEY` | AI summary generation support |
| `GEMINI_MODEL` | Optional Gemini model override |
| `GROQ_API_KEY` | Community chatbot integration |
| `GROQ_MODEL` | Optional Groq model override |
| `HF_TOKEN` | Hugging Face tagging integration |
| `HF_MODEL` | Optional Hugging Face model override |
| `HF_ENDPOINT` | Optional custom inference endpoint |
| `HF_TIMEOUT_MS` | AI request timeout |
| `HF_TAG_SCORE_THRESHOLD` | AI tag confidence threshold |
| `PAYHERE_MERCHANT_ID` | Payment gateway merchant ID |
| `PAYHERE_MERCHANT_SECRET` | Payment gateway secret |
| `PAYHERE_SANDBOX` | Payment test/sandbox mode |
| `PAYHERE_RETURN_URL` | Frontend success callback |
| `PAYHERE_CANCEL_URL` | Frontend cancellation callback |
| `PAYHERE_NOTIFY_URL` | Backend webhook callback |

### Frontend Configuration Note

The current frontend Axios client is configured with a local default base URL:

```js
http://localhost:5000/api
```

For deployment, a safer production-ready pattern is to move this into a frontend environment variable such as:

```env
VITE_API_BASE_URL=https://<your-backend-domain>/api
```

## Run the Project

### Backend

```bash
cd backend
npm run dev
```

Production mode:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm run dev
```

By default, the system runs locally with:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Deployment

Deployment should always use environment-managed secrets and a dedicated production MongoDB connection. Do not reuse local or academic testing values in production.

### Backend Deployment

**Recommended platforms**

- Render
- Railway

**Typical deployment steps**

1. Create a backend service from the repository.
2. Set the service root directory to `backend/`.
3. Configure build command: `npm install`
4. Configure start command: `npm start`
5. Add environment variables such as `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, and any optional AI/payment keys.
6. Verify the deployment using the `/health` endpoint.

**Example live backend URL**

```text
https://<your-backend-service>.onrender.com
```

### Frontend Deployment

**Recommended platforms**

- Vercel
- Netlify

**Typical deployment steps**

1. Create a frontend project from the same repository.
2. Set the root directory to `frontend/`.
3. Configure build command: `npm run build`
4. Configure output directory: `dist`
5. Set `VITE_API_BASE_URL` to the deployed backend API URL.
6. Redeploy and verify login, experiment listing, community pages, and role-specific dashboards.

**Example live frontend URL**

```text
https://<your-frontend-app>.vercel.app
```

### Deployment Variables Summary

Do not expose secrets in the README, source code, or screenshots.

- Backend: `PORT`, `MONGODB_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, optional AI/payment keys
- Frontend: recommended `VITE_API_BASE_URL`

## Additional Features

HealthLab includes several advanced capabilities beyond basic CRUD.

- Role-based dashboards for different user types
- Researcher approval and moderation workflow
- Experiment eligibility criteria and recommendation logic
- Daily log collection with dynamic field definitions
- Funding workflows with experiment wallets and contribution tracking
- Community discussion features with likes, comments, poll voting, reports, and saves
- AI-assisted features for summaries, tagging, and chatbot-style interactions
- Validation and error-handling patterns across multiple modules
- PDF export and analytics support on the admin side

## Git Workflow

For a clean academic and team-based workflow, the repository should follow a structured branching strategy.

- Create separate feature branches for new modules or fixes
- Open pull requests for review before merging
- Use clear, meaningful commit messages
- Maintain an integration branch for combined testing before release
- Keep `main` or the final release branch stable and presentation-ready

**Recommended commit style**

- `feat: add experiment review workflow`
- `fix: correct eligibility validation for BMI range`
- `test: add integration coverage for participation routes`
- `docs: update deployment and testing instructions`

## Notes

- This project is tailored for HealthLab and reflects the current repository structure.
- The backend README provides additional endpoint-level detail for API consumers.
- Integration and performance testing should always use isolated test-safe environments.
- The production database must remain separate from test and development environments.

## License

This repository is intended for academic and portfolio use unless a separate license file is added.
