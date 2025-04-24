# SQL Agent Backend Documentation

## Overview

This project is a sophisticated SQL agent system that allows users to connect to their PostgreSQL databases, visualize database schema, and generate SQL queries from natural language prompts. The application uses FastAPI for the backend API, SQLModel for ORM, and Gemini AI (Google's generative AI) for natural language to SQL conversion.

## System Architecture

The backend consists of several interconnected components:

1. **FastAPI Application**: The core web server handling HTTP requests
2. **Authentication System**: JWT-based authentication for user security
3. **Database Connection Management**: Tools for connecting to and managing user's PostgreSQL databases
4. **SQL Generation Agent**: AI-powered component that transforms natural language into SQL
5. **Database Schema Visualization**: Tools for extracting and visualizing database structure

## Core Components

### Authentication System

The system implements secure user authentication:
- User registration/signup with password hashing
- JWT token-based authentication
- Protected routes requiring authentication

### Database Management

Users can:
- Add multiple database connections with encrypted credentials
- Update database connection settings
- Delete database connections
- View all their connected databases

### SQL Agent

The AI-powered SQL agent:
- Extracts database schema and structure
- Uses Google's Gemini AI to convert natural language to SQL
- Allows users to execute generated SQL queries
- Stores query history for future reference

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/signup` | POST | Register a new user | `UserCreate` | `UserRead` |
| `/login` | POST | Authenticate user | `UserLogin` | `{"access_token": <token>}` |
| `/me` | GET | Get current user info | - | User info |

### Database Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/databases` | POST | Add a new database connection | `UserDatabaseCreate` | DB info with ID |
| `/get_databases` | GET | List all user's databases | - | List of `UserDatabaseRead` |
| `/databases/{db_id}` | PUT | Update database settings | `UserDatabaseUpdate` | Updated DB info |
| `/databases/{db_id}` | DELETE | Delete a database connection | - | Success message |
| `/query-history/{db_id}` | GET | Get query history for a database | - | List of `QueryHistoryRead` |

### Agent Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/agent/generate-sql` | POST | Generate SQL from natural language | `GenerateSQLRequest` | `GenerateSQLResponse` |
| `/agent/execute-sql` | POST | Execute generated SQL | `ExecuteSQLRequest` | `ExecuteSQLResponse` |
| `/agent/visualize-schema` | GET | Get DB schema visualization | `db_id` (query param) | Schema JSON |

## Data Models

### User Models

- **User**: Core user account information
  - `id`: Unique identifier
  - `username`: Unique username
  - `password_hash`: Hashed password
  - `databases`: List of associated databases

- **UserCreate**: Data model for user registration
  - `username`: Chosen username
  - `password`: Plain text password (never stored)

- **UserLogin**: Data model for user authentication
  - `username`: User's username
  - `password`: User's password

### Database Models

- **UserDatabase**: Stored database connection
  - `id`: Unique identifier
  - `user_id`: Associated user
  - `host`: Database host
  - `port`: Database port
  - `db_user`: Database username
  - `db_password_encrypted`: Encrypted database password
  - `db_name`: Database name
  - `created_at`: Timestamp

- **UserDatabaseCreate**: Data model for adding a database
  - `host`: Database host
  - `port`: Database port
  - `db_user`: Database username
  - `db_password`: Plain text password (encrypted before storage)
  - `db_name`: Database name

- **UserDatabaseUpdate**: Data model for updating database settings
  - All fields optional

### Query History Models

- **QueryHistory**: Record of SQL queries
  - `id`: Unique identifier
  - `user_database_id`: Associated database
  - `original_prompt`: User's natural language prompt
  - `generated_sql`: Generated SQL query
  - `success`: Execution success flag
  - `error_message`: Error details if any
  - `executed_at`: Timestamp

## Utilities

### Database Connection

The system securely manages database connections:
1. Establishes connections to PostgreSQL databases
2. Uses Fernet symmetric encryption for database passwords
3. Creates SQLAlchemy engine instances for database operations

### PostgreSQL Tools

A comprehensive PostgreSQL interaction toolkit that can:
- List schemas and tables
- Describe table structure (columns, types, constraints)
- Preview table data
- Count rows in tables
- Execute arbitrary SQL queries

### Database Agent

The AI agent system that:
1. Connects to the user's database
2. Extracts database schema and sample data
3. Sends structured information to Gemini AI
4. Processes and cleans the generated SQL
5. Handles execution of queries

### Encryption

Secure password management using Fernet symmetric encryption:
- Encrypts database passwords before storage
- Decrypts passwords when establishing connections
- Uses environment variables for key management

## Security Considerations

1. **Authentication**: JWT token-based authentication with bearer scheme
2. **Password Security**: Passwords are hashed using secure hashing algorithms
3. **Database Credentials**: Database passwords are encrypted at rest
4. **SQL Injection**: User inputs are sanitized using SQLAlchemy parameterization

## Environment Configuration

The application requires the following environment variables:
- `GEMINI_API_KEY`: Google Gemini AI API key
- `FERNET_KEY`: Secret key for Fernet encryption
- Database configuration settings

## Dependencies

- FastAPI: Web framework
- SQLModel: ORM
- Google Generative AI: AI model for SQL generation
- Cryptography: For secure encryption
- SQLAlchemy: Database interaction
- Pydantic: Data validation

## Error Handling

The application implements comprehensive error handling:
- HTTP exceptions with appropriate status codes
- Detailed error messages
- Database connection error handling
- AI model error handling
