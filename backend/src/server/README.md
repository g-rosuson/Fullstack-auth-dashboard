# Server Module

This module handles application startup, database initialization, and graceful shutdown orchestration.

## Components

### `index.ts` - Server Initialization
Core Express application setup with middleware and routing configuration.

**Responsibilities:**
- Initialize Express application with all middleware (CORS, body parsing, context)
- Configure routes (documentation, authentication, cron jobs)
- Add exception handling middleware
- Initialize database connection with retry logic

**Key Features:**
- Database initialization is performed before middleware setup
- All middleware configured in proper order
- Exception middleware added last to catch all errors

### `server-initialize-db.ts` - Database Initialization
Handles MongoDB connection with retry logic and cron job scheduling.

**Responsibilities:**
- Connect to MongoDB with configurable retry attempts
- Schedule active cron jobs from database
- Handle database connection failures gracefully

**Retry Configuration:**
- `MAX_DB_RETRIES`: Maximum retry attempts (default: 3)
- `DB_RETRY_DELAY_MS`: Fixed delay between retries (default: 5000ms)

**Process:**
1. Get MongoClientManager instance
2. Connect with retry logic (transient failures only)
3. Query persisted cron jobs
4. Schedule active jobs with Scheduler

### `server-shutdown-manager.ts` - Graceful Shutdown
Singleton class managing application shutdown lifecycle.

**Responsibilities:**
- Handle SIGTERM/SIGINT signals
- Orchestrate ordered resource cleanup
- Provide timeout protection
- Prevent duplicate shutdown attempts

**Shutdown Sequence:**
1. Stop accepting new HTTP requests
2. Close database connections
3. Exit process with appropriate code

**Features:**
- 30-second timeout to prevent hangs
- Comprehensive logging for observability
- Error handling during cleanup
- Configurable exit codes

### `server-shutdown-manager.test.ts` - Test Suite
Comprehensive tests for ShutdownManager functionality.

**Test Coverage:**
- Singleton pattern verification
- Signal handler registration
- Graceful shutdown sequence
- Error handling scenarios
- Timeout protection
- Duplicate request prevention

## Integration Flow

### Startup Process
```
main.ts
├── server.init()
│   ├── initializeDatabase()
│   │   ├── MongoClientManager.connect() [with retry]
│   │   └── Schedule active cron jobs
│   ├── Configure Express middleware
│   └── Setup routes
├── Create HTTP server
└── Register with ShutdownManager
```

### Shutdown Process
```
Signal Received (SIGTERM/SIGINT)
├── ShutdownManager.initiateShutdown()
├── Stop HTTP server (stop accepting requests)
├── Close database connections
└── Exit process
```

### Error Handling
```
Startup Error
├── Log error details
├── Register HTTP server with ShutdownManager (if created)
└── Trigger graceful shutdown with exit code 1
```

## Configuration

### Environment Variables
- `MAX_DB_RETRIES`: Database connection retry attempts (default: 3)
- `DB_RETRY_DELAY_MS`: Delay between retry attempts in milliseconds (default: 5000)

### Retry Logic
- **Fixed-interval strategy**: Consistent delay between attempts
- **Transient failures only**: Network issues, not configuration errors
- **Fail-fast on ping/indexing**: These indicate config problems

## Production Considerations

### Container Deployment
- Responds to SIGTERM for graceful container shutdown
- Timeout protection prevents indefinite hangs
- Proper exit codes for orchestration systems

### Monitoring
- Comprehensive logging at each step
- Error context preservation
- Startup/shutdown event tracking

### Resilience
- Database connection retry for transient failures
- Graceful degradation on startup errors
- Resource cleanup on any failure scenario

## Error Scenarios

### Database Connection Failure
1. Retry with fixed intervals
2. If all retries fail, log error and exit
3. ShutdownManager handles cleanup

### Startup Failure After Server Creation
1. Register server with ShutdownManager
2. Trigger graceful shutdown
3. Clean exit with error code

### Signal-Triggered Shutdown
1. ShutdownManager handles SIGTERM/SIGINT
2. Ordered resource cleanup
3. Timeout protection if cleanup hangs
4. Clean exit with success code

## Testing

Run the ShutdownManager tests:
```bash
npm test -- src/server/server-shutdown-manager.test.ts
```

The test suite covers all critical paths including success scenarios, error handling, and timeout behavior.