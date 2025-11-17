# Connector System Status

**Date**: 2025-01-27

## Connector Types (Kinds) Defined

The system defines 4 connector types in `src/core/connectors/types.ts`:

1. **`llm`** - Language Model connectors (AI assistants)
2. **`storage`** - Storage system connectors (databases, cloud storage)
3. **`document`** - Document system connectors (file systems, document stores)
4. **`integration`** - Integration connectors (APIs, webhooks, third-party services)

## What's Actually Implemented

### ✅ LLM Connectors (IMPLEMENTED)
- **Claude (Anthropic)**: UI simplified to collect API key, registers as `llm.claude`
- **ChatGPT (OpenAI)**: UI simplified to collect API key, registers as `llm.chatgpt`
- **Status**: Working - users can add these via the UI, API keys stored in credential vault
- **Implementation**: Managed connectors with health checks that verify API keys exist

### ❌ Storage Connectors (NOT IMPLEMENTED)
- **Defined in architecture**: `LocalSqliteConnector`, future `RestApiAdapter`, `DynamoAdapter`
- **Current reality**: App uses SQLite directly via `WorkflowDatabase` class
- **Status**: Architecture planned but not implemented - no storage connectors exist
- **What exists**: `WorkflowDatabase` directly uses `better-sqlite3` - not through connector pattern

### ⚠️ Document Connectors (PARTIALLY IMPLEMENTED)
- **FileConnector exists**: `src/core/files/fileConnector.ts` - handles local file operations
- **Not registered as connector**: `FileConnector` is used directly by `DocumentService`, not through connector registry
- **Status**: File operations work, but not using the connector pattern
- **What exists**: Internal file operations, not exposed as a connector

### ❌ Integration Connectors (NOT IMPLEMENTED)
- **Status**: Type defined but no implementations exist
- **Use case**: Would be for third-party API integrations, webhooks, etc.

## Current Architecture Reality

### What Works
1. **Connector Registry**: Framework exists to register/manage connectors
2. **LLM Connectors**: Claude and ChatGPT can be added via UI
3. **Credential Vault**: Stores API keys securely
4. **Health Checks**: Can verify if connectors have required secrets

### What's Missing
1. **Storage Connectors**: No actual storage connectors - app uses SQLite directly
2. **Document Connectors**: `FileConnector` exists but isn't part of connector system
3. **Integration Connectors**: No implementations
4. **Actual LLM Integration**: Connectors are registered but don't actually call Claude/ChatGPT APIs yet

## Recommendations

### Option 1: Simplify to LLM Only (Current Direction)
- Remove `storage`, `document`, `integration` connector types
- Focus only on LLM connectors (Claude, ChatGPT)
- Keep connector registry simple for just LLM management

### Option 2: Implement Full Connector System
- Create actual storage connectors (wrap `WorkflowDatabase` in `LocalSqliteConnector`)
- Register `FileConnector` as a document connector
- Build out integration connector framework
- Implement actual LLM API calls in connectors

### Option 3: Hybrid Approach
- Keep LLM connectors as-is (working)
- Remove unused connector types from UI
- Document that storage/document are internal, not user-configurable connectors

## Next Steps

**Question for user**: What systems should users actually be able to connect to?

- **Just LLM services** (Claude, ChatGPT)? ← Current simplified UI supports this
- **Storage systems** (cloud databases, REST APIs)? ← Not implemented
- **Document systems** (cloud storage, SharePoint)? ← Not implemented  
- **Integration services** (webhooks, APIs)? ← Not implemented

