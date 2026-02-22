# HealthLab Fund Management Backend

REST API for managing experiment fund requests, approval workflows, and wallet allocations.

## Features
- **Authentication**: JWT-based auth with RBAC (Researcher vs Admin).
- **Fund Requests**: Researchers can request top-ups.
- **Admin Review**: Admins review, approve/reject requests.
- **Wallet System**: Approved funds are automatically credited to Experiment Wallet (Transactionally secure).
- **Audit Logging**: All actions are logged.
- **Analytics**: Admin dashboard stats.

## Setup
1. **Prerequisites**: Node.js v14+, MongoDB running locally (default `mongodb://localhost:27017`).
2. **Install**:
   ```bash
   cd backend
   npm install
   ```
3. **Env Vars**:
   Create `.env` (already provided):
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/healthlab_fund_mgmt
   JWT_SECRET= ...
   ```

## Run
- **Start Server**:
  ```bash
  npm start
  ```
- **Dev Mode**:
  ```bash
  npm run dev
  ```
- **Seed Data**:
  ```bash
  npm run seed
  ```
- **Run Tests**:
  ```bash
  npm test
  ```

## API Documentation
Swagger docs available at: `http://localhost:5000/docs`

## Sample Workflow (cURL)

### 1. Login as Researcher
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"researcher@healthlab.io", "password":"password123"}'
```
*Copy the `token` from response.*

### 2. Create Fund Request
```bash
curl -X POST http://localhost:5000/api/fund-requests \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "experimentId": "65...", 
    "requestedAmount": 500,
    "reason": "Top up"
  }'
```

### 3. Login as Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthlab.io", "password":"password123"}'
```

### 4. Approve Request
```bash
curl -X PATCH http://localhost:5000/api/admin/fund-requests/<REQUEST_ID>/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED", "adminDecisionNote": "Approved"}'
```

