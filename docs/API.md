# SuperSix API Documentation

## Base URL
```
/api/
```

## Authentication
All API endpoints (except registration/login) require user authentication via PHP sessions. Include cookies in requests to maintain session state.

## Response Format
All responses are in JSON format:

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error description"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User
```http
POST /api/auth.php?action=register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "remember": false
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified": false
  }
}
```

### Login User
```http
POST /api/auth.php?action=login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "remember": false
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified": true
  }
}
```

### Get Current User
```http
GET /api/auth.php?action=me
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified": true,
    "created_at": "2025-01-15 10:30:00"
  }
}
```

### Logout
```http
POST /api/auth.php?action=logout
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Email Verification
```http
GET /api/auth.php?action=verify&token={verification_token}
```

### Resend Verification Email
```http
GET /api/auth.php?action=resend
```

---

## Board Endpoints

### Get All Boards
```http
GET /api/boards.php
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Work Projects",
    "color": "cyan",
    "archived": false,
    "active_count": 3,
    "createdAt": "2025-01-15 10:30:00"
  }
]
```

### Create Board
```http
POST /api/boards.php
```

**Body:**
```json
{
  "name": "Personal Goals",
  "color": "green"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Personal Goals",
  "color": "green",
  "archived": false,
  "active_count": 1,
  "createdAt": "2025-01-15 11:00:00"
}
```

### Update Board
```http
PUT /api/boards.php
```

**Body:**
```json
{
  "id": 1,
  "name": "Updated Board Name"
}
```

### Archive Board
```http
DELETE /api/boards.php?id=1
```

**Response:**
```json
{
  "message": "Board archived successfully"
}
```

---

## Task Endpoints

### Get Tasks for Board
```http
GET /api/tasks.php?board_id=1
```

**Response:**
```json
[
  {
    "id": 1,
    "boardId": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "active",
    "position": 1,
    "dueDate": "2025-01-20 14:00:00",
    "createdAt": "2025-01-15 10:30:00",
    "completedAt": null
  }
]
```

### Create Task
```http
POST /api/tasks.php
```

**Body:**
```json
{
  "board_id": 1,
  "title": "New task title",
  "description": "Task description (optional)",
  "dueDate": "2025-01-20 14:00:00"
}
```

### Update Task
```http
PUT /api/tasks.php
```

**Body:**
```json
{
  "id": 1,
  "title": "Updated task title",
  "description": "Updated description",
  "dueDate": "2025-01-21 15:00:00"
}
```

### Delete Task
```http
DELETE /api/tasks.php?id=1
```

### Complete Task
```http
POST /api/tasks.php?action=complete
```

**Body:**
```json
{
  "id": 1
}
```

### Promote Task (Queue → Active)
```http
POST /api/tasks.php?action=promote
```

**Body:**
```json
{
  "id": 1
}
```

### Demote Task (Active → Queue)
```http
POST /api/tasks.php?action=demote
```

**Body:**
```json
{
  "id": 1
}
```

### Postpone Task (+1 day)
```http
POST /api/tasks.php?action=postpone
```

**Body:**
```json
{
  "id": 1
}
```

### Reorder Task
```http
POST /api/tasks.php?action=reorder
```

**Body:**
```json
{
  "id": 1,
  "direction": "up"
}
```

**Direction options:** `up`, `down`

### Undo Complete Task
```http
POST /api/tasks.php?action=undo
```

**Body:**
```json
{
  "id": 1
}
```

---

## Subtask Endpoints

### Get Subtasks for Task
```http
GET /api/subtasks.php?task_id=1
```

**Response:**
```json
[
  {
    "id": 1,
    "taskId": 1,
    "title": "Research requirements",
    "completed": false,
    "position": 1,
    "createdAt": "2025-01-15 10:30:00",
    "completedAt": null
  }
]
```

### Create Subtask
```http
POST /api/subtasks.php
```

**Body:**
```json
{
  "task_id": 1,
  "title": "New subtask"
}
```

### Toggle Subtask Completion
```http
POST /api/subtasks.php?action=toggle
```

**Body:**
```json
{
  "id": 1
}
```

### Delete Subtask
```http
DELETE /api/subtasks.php?id=1
```

---

## Task Status Flow

```
Queued → Active (max 6) → Completed
   ↑         ↓
   ← — — — — ←
```

### Status Rules:
- **Active**: Maximum 6 tasks, ordered by priority (1-6)
- **Queued**: Unlimited tasks waiting for activation
- **Completed**: Finished tasks with completion timestamp

### Automatic Promotions:
- When an active task is completed/deleted, the first queued task automatically promotes to active
- When promoting a queued task to a full active list (6 tasks), the #6 active task moves to queue

---

## Error Handling

### Common Errors:

**Authentication Required (401)**
```json
{
  "error": "Authentication required"
}
```

**Validation Error (400)**
```json
{
  "error": "Field 'title' is required"
}
```

**Not Found (404)**
```json
{
  "error": "Task not found or access denied"
}
```

**Business Logic Error (400)**
```json
{
  "error": "Cannot move task in that direction"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing:
- Login attempt limiting
- API request rate limiting per user
- Email sending rate limiting

---

## CORS Headers

The API includes CORS headers for cross-origin requests:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Security Notes

1. **Authentication**: All endpoints except auth use PHP session-based authentication
2. **Authorization**: Users can only access their own boards/tasks
3. **Input Validation**: Required fields are validated, inputs are sanitized
4. **SQL Injection**: All queries use prepared statements
5. **Password Security**: Passwords are hashed with PHP's `password_hash()`

For production deployment:
- Use HTTPS only
- Implement rate limiting
- Add request logging
- Consider JWT tokens for API authentication
- Add CSRF protection for web interface