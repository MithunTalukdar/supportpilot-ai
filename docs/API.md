# SupportPilot AI — REST API Specification

## 1. Global API Standards

- **Base URL:** `/api/v1`
- **Content-Type:** `application/json` (except multipart file uploads)
- **Authentication:** Bearer JWT in the `Authorization` header (`Authorization: Bearer <token>`) or HttpOnly refresh cookies.
- **Organization Header:** Scoped routes accept `:orgId` as a URL parameter, with an optional fallback `X-Organization-Id` header for cross-checking.

### 1.1 Response Envelopes

#### Success Envelope (`200 OK`, `201 Created`, `202 Accepted`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 142,
    "totalPages": 8
  }
}
```

#### Error Envelope (`400`, `401`, `403`, `404`, `422`, `429`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request payload failed schema validation",
    "details": [
      {
        "field": "priority",
        "message": "Invalid enum value. Expected 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'"
      }
    ],
    "requestId": "req_01HPX7K8G003A7Z"
  }
}
```

### 1.2 Rate Limiting Headers
All responses include standard rate-limiting headers:
- `X-RateLimit-Limit`: Maximum requests permitted per window.
- `X-RateLimit-Remaining`: Requests remaining in the current window.
- `X-RateLimit-Reset`: Unix timestamp when the quota resets.
- `Retry-After`: Seconds to wait before retrying (sent on `429 Too Many Requests`).

---

## 2. Authentication & User Profile Endpoints

### 2.1 Register User
- **Method & Path:** `POST /api/v1/auth/register`
- **Access Level:** Public
- **Description:** Registers a new user account.
- **Request Body:**
```json
{
  "email": "sarah.connor@acme.com",
  "password": "SecurePassword123!",
  "fullName": "Sarah Connor"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "sarah.connor@acme.com",
      "fullName": "Sarah Connor",
      "avatarUrl": null,
      "createdAt": "2026-10-26T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 Login User
- **Method & Path:** `POST /api/v1/auth/login`
- **Access Level:** Public
- **Description:** Authenticates user credentials and sets HttpOnly refresh token cookie.
- **Request Body:**
```json
{
  "email": "sarah.connor@acme.com",
  "password": "SecurePassword123!"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "sarah.connor@acme.com",
      "fullName": "Sarah Connor"
    },
    "memberships": [
      {
        "organizationId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "organizationName": "Acme Corp",
        "organizationSlug": "acme",
        "role": "OWNER"
      }
    ],
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3 Refresh Access Token
- **Method & Path:** `POST /api/v1/auth/refresh`
- **Access Level:** Public (Requires valid Refresh Token Cookie)
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.4 Get Current Profile
- **Method & Path:** `GET /api/v1/auth/me`
- **Access Level:** Authenticated User
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "sarah.connor@acme.com",
      "fullName": "Sarah Connor"
    },
    "memberships": [
      {
        "organizationId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "organizationName": "Acme Corp",
        "role": "OWNER"
      }
    ]
  }
}
```

---

## 3. Organization Management Endpoints

### 3.1 Create Organization
- **Method & Path:** `POST /api/v1/organizations`
- **Access Level:** Authenticated User
- **Description:** Creates an organization and grants the creator the `OWNER` role.
- **Request Body:**
```json
{
  "name": "Starlight Logistics",
  "slug": "starlight-logistics"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "7ca8c921-9dad-11d1-80b4-00c04fd430c9",
    "name": "Starlight Logistics",
    "slug": "starlight-logistics",
    "role": "OWNER"
  }
}
```

### 3.2 List Members & Roles
- **Method & Path:** `GET /api/v1/organizations/:orgId/members`
- **Access Level:** OWNER, AGENT
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "mem_1",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Sarah Connor",
      "email": "sarah.connor@acme.com",
      "role": "OWNER",
      "joinedAt": "2026-10-26T12:00:00.000Z"
    }
  ]
}
```

### 3.3 Add Member / Assign Role
- **Method & Path:** `POST /api/v1/organizations/:orgId/members`
- **Access Level:** OWNER
- **Request Body:**
```json
{
  "email": "john.doe@acme.com",
  "role": "AGENT"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "message": "Member successfully added to organization",
    "memberId": "mem_2",
    "role": "AGENT"
  }
}
```

---

## 4. Ticket Management Endpoints

### 4.1 List Tickets (Filtered & Paginated)
- **Method & Path:** `GET /api/v1/organizations/:orgId/tickets`
- **Access Level:** OWNER, AGENT (sees all org tickets); CUSTOMER (sees only their own tickets)
- **Query Parameters:**
  - `status`: Filter by `OPEN`, `PENDING`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
  - `priority`: Filter by `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  - `assignedAgentId`: Filter by assigned agent UUID
  - `search`: Search string matched against title and description
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `20`, max: `100`)
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tic_9921",
      "ticketNumber": 1042,
      "title": "Cannot export monthly billing invoice to CSV",
      "status": "OPEN",
      "priority": "HIGH",
      "customer": {
        "id": "usr_99",
        "fullName": "Alex Mercer",
        "email": "alex@mercer.com"
      },
      "assignedAgent": {
        "id": "usr_12",
        "fullName": "Support Agent Jim"
      },
      "tags": ["billing", "export", "csv"],
      "aiCategory": "Billing & Payments",
      "sentimentScore": -0.45,
      "createdAt": "2026-10-26T14:30:00.000Z",
      "commentCount": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

### 4.2 Create Ticket
- **Method & Path:** `POST /api/v1/organizations/:orgId/tickets`
- **Access Level:** CUSTOMER, AGENT, OWNER
- **Request Body:**
```json
{
  "title": "API Gateway returning 504 Gateway Timeout during sync",
  "description": "Every day at 02:00 UTC our sync pipeline fails with 504. Trace ID: trc_882910.",
  "priority": "HIGH"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "tic_9922",
    "ticketNumber": 1043,
    "title": "API Gateway returning 504 Gateway Timeout during sync",
    "status": "OPEN",
    "priority": "HIGH",
    "createdAt": "2026-10-26T15:00:00.000Z"
  }
}
```

### 4.3 Get Ticket Details
- **Method & Path:** `GET /api/v1/organizations/:orgId/tickets/:ticketId`
- **Access Level:** OWNER, AGENT, or Ticket Customer
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "tic_9922",
    "ticketNumber": 1043,
    "title": "API Gateway returning 504 Gateway Timeout during sync",
    "description": "Every day at 02:00 UTC our sync pipeline fails with 504...",
    "status": "OPEN",
    "priority": "HIGH",
    "aiSummary": "Customer experiencing daily 504 timeouts at 02:00 UTC during sync.",
    "aiCategory": "Infrastructure",
    "customer": {
      "id": "usr_99",
      "fullName": "Alex Mercer",
      "email": "alex@mercer.com"
    },
    "assignedAgent": null,
    "comments": [
      {
        "id": "com_1",
        "author": { "fullName": "Alex Mercer" },
        "content": "Initial report submitted.",
        "isInternal": false,
        "createdAt": "2026-10-26T15:00:00.000Z"
      }
    ]
  }
}
```

### 4.4 Update Ticket (Status, Priority, Assignment)
- **Method & Path:** `PATCH /api/v1/organizations/:orgId/tickets/:ticketId`
- **Access Level:** OWNER, AGENT
- **Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "assignedAgentId": "usr_12"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "tic_9922",
    "status": "IN_PROGRESS",
    "priority": "URGENT",
    "assignedAgentId": "usr_12",
    "updatedAt": "2026-10-26T15:05:00.000Z"
  }
}
```

---

## 5. Ticket Comment & Thread Endpoints

### 5.1 Post Comment
- **Method & Path:** `POST /api/v1/organizations/:orgId/tickets/:ticketId/comments`
- **Access Level:** OWNER, AGENT, or Ticket Customer
- **Request Body:**
```json
{
  "content": "We have identified an upstream load balancer timeout and deployed a fix.",
  "isInternal": false
}
```
> *Note: If a `CUSTOMER` attempts to send `isInternal: true`, the API will enforce `isInternal: false`.*
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "com_201",
    "ticketId": "tic_9922",
    "content": "We have identified an upstream load balancer timeout...",
    "isInternal": false,
    "author": {
      "id": "usr_12",
      "fullName": "Support Agent Jim"
    },
    "createdAt": "2026-10-26T15:15:00.000Z"
  }
}
```

### 5.2 List Comments
- **Method & Path:** `GET /api/v1/organizations/:orgId/tickets/:ticketId/comments`
- **Access Level:** OWNER, AGENT, or Ticket Customer
- **Description:** Returns the chronological comment thread. If the requester has role `CUSTOMER`, all comments with `isInternal = true` are filtered out.

---

## 6. Knowledge Base Ingestion Endpoints

### 6.1 Upload Document
- **Method & Path:** `POST /api/v1/organizations/:orgId/documents`
- **Access Level:** OWNER, AGENT
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: PDF, Markdown, or TXT document (Max 15MB)
  - `title`: Optional custom title
- **Response (`202 Accepted`):**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_8831",
    "title": "Refund_and_Cancellation_Policy_2026.pdf",
    "fileType": "application/pdf",
    "status": "PENDING",
    "message": "Document accepted for processing and vector indexing."
  }
}
```

### 6.2 List Knowledge Documents
- **Method & Path:** `GET /api/v1/organizations/:orgId/documents`
- **Access Level:** OWNER, AGENT
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_8831",
      "title": "Refund Policy 2026",
      "status": "INDEXED",
      "fileType": "pdf",
      "byteSize": 142050,
      "chunkCount": 18,
      "createdAt": "2026-10-26T10:00:00.000Z"
    }
  ]
}
```

### 6.3 Delete Knowledge Document
- **Method & Path:** `DELETE /api/v1/organizations/:orgId/documents/:docId`
- **Access Level:** OWNER, AGENT
- **Description:** Deletes the document record and automatically cascades deletions to all associated `document_chunks` in pgvector.

---

## 7. RAG Chatbot Endpoints

### 7.1 Start / Retrieve Chat Conversation
- **Method & Path:** `POST /api/v1/organizations/:orgId/chat/conversations`
- **Access Level:** CUSTOMER, AGENT, OWNER
- **Request Body:**
```json
{
  "channel": "WIDGET",
  "ticketId": null
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "conversationId": "chat_001",
    "title": "New Support Conversation",
    "channel": "WIDGET",
    "createdAt": "2026-10-26T16:00:00.000Z"
  }
}
```

### 7.2 Send Message & Synthesize RAG Response
- **Method & Path:** `POST /api/v1/organizations/:orgId/chat/conversations/:conversationId/messages`
- **Access Level:** CUSTOMER, AGENT, OWNER
- **Request Body:**
```json
{
  "content": "Can I get a full refund within 14 days of purchase?"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "msg_1",
      "content": "Can I get a full refund within 14 days of purchase?",
      "senderType": "CUSTOMER",
      "createdAt": "2026-10-26T16:00:01.000Z"
    },
    "botResponse": {
      "id": "msg_2",
      "content": "Yes, under our 2026 Refund Policy, you are entitled to a 100% full refund if requested within 14 calendar days of your initial subscription purchase [1].",
      "senderType": "BOT",
      "citations": [
        {
          "citationNumber": 1,
          "documentId": "doc_8831",
          "documentTitle": "Refund Policy 2026",
          "snippet": "All customers are eligible for an unconditional 100% refund within 14 calendar days..."
        }
      ],
      "tokenMetrics": {
        "promptTokens": 380,
        "completionTokens": 45,
        "totalTokens": 425
      },
      "createdAt": "2026-10-26T16:00:03.000Z"
    }
  }
}
```

---

## 8. AI Agent Assist Endpoints (For Support Agents)

### 8.1 Summarize Ticket Thread
- **Method & Path:** `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/summarize`
- **Access Level:** OWNER, AGENT
- **Description:** Condenses ticket description and all comments into a concise summary and action list.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "summary": "Customer reported 504 timeouts on daily sync at 02:00 UTC. Agent identified load balancer idle timeout misconfiguration and applied a patch. Awaiting customer confirmation.",
    "keyEntities": ["504 Gateway Timeout", "Load Balancer", "02:00 UTC"],
    "actionItems": ["Verify sync execution at next 02:00 UTC cycle", "Close ticket if healthy"]
  }
}
```

### 8.2 Classify & Triage Ticket
- **Method & Path:** `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/classify`
- **Access Level:** OWNER, AGENT
- **Description:** Analyzes sentiment, categorizes issue, and suggests recommended priority.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "category": "Infrastructure & Networking",
    "suggestedPriority": "URGENT",
    "sentiment": "NEGATIVE",
    "sentimentScore": -0.62,
    "urgencyReason": "Customer's automated nightly pipeline is completely blocked."
  }
}
```

### 8.3 Generate Smart Reply Draft
- **Method & Path:** `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/suggest-reply`
- **Access Level:** OWNER, AGENT
- **Request Body (Optional):**
```json
{
  "instructions": "Be polite, apologize for the sync delay, and explain the load balancer fix."
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "suggestedReply": "Hi Alex,\n\nThank you for your patience while we investigated this. We found that the load balancer was timing out on heavy requests at 02:00 UTC. We have increased the timeout threshold and deployed the configuration update.\n\nPlease let us know if your next sync completes smoothly.\n\nBest regards,\nAcme Support Team",
    "confidence": 0.94,
    "citations": []
  }
}
```

---

## 9. Analytics & AI Usage Endpoints

### 9.1 Support Operations Overview
- **Method & Path:** `GET /api/v1/organizations/:orgId/analytics/overview`
- **Access Level:** OWNER, AGENT
- **Query Parameters:** `from` (ISO date), `to` (ISO date)
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalTickets": 142,
    "openTickets": 18,
    "resolvedTickets": 120,
    "avgResolutionTimeMinutes": 84.5,
    "statusBreakdown": {
      "OPEN": 18,
      "IN_PROGRESS": 4,
      "RESOLVED": 120
    },
    "priorityBreakdown": {
      "LOW": 30,
      "MEDIUM": 75,
      "HIGH": 30,
      "URGENT": 7
    }
  }
}
```

### 9.2 AI Token & Cost Metering
- **Method & Path:** `GET /api/v1/organizations/:orgId/analytics/ai-usage`
- **Access Level:** OWNER
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalTokensConsumed": 482900,
    "totalCostUsd": "1.448700",
    "usageByFeature": {
      "RAG_CHAT": { "tokens": 312000, "costUsd": "0.936000", "calls": 210 },
      "TICKET_SUMMARY": { "tokens": 85000, "costUsd": "0.255000", "calls": 75 },
      "REPLY_SUGGESTION": { "tokens": 64900, "costUsd": "0.194700", "calls": 52 },
      "DOCUMENT_EMBEDDING": { "tokens": 21000, "costUsd": "0.063000", "calls": 12 }
    }
  }
}
```

---

## 10. Audit Log Endpoints

### 10.1 List Organization Audit Events
- **Method & Path:** `GET /api/v1/organizations/:orgId/audit-logs`
- **Access Level:** OWNER
- **Query Parameters:** `page`, `limit`, `actorId`, `action`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "aud_501",
      "action": "TICKET_PRIORITY_ESCALATED",
      "entityType": "TICKET",
      "entityId": "tic_9922",
      "actor": {
        "id": "usr_12",
        "fullName": "Support Agent Jim"
      },
      "changes": {
        "before": { "priority": "MEDIUM" },
        "after": { "priority": "URGENT" }
      },
      "ipAddress": "192.168.1.45",
      "createdAt": "2026-10-26T15:05:00.000Z"
    }
  ]
}
```
