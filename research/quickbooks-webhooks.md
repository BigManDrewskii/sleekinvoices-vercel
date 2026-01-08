# QuickBooks Webhooks Research

## Key Findings

### Webhook Support
QuickBooks Online supports webhooks for receiving event-triggered callbacks when data changes in connected QuickBooks companies.

### Supported Entities
QuickBooks webhooks support notifications for various entities including:
- Invoice (create, update, delete)
- Payment (create, update, delete)
- Customer (create, update, delete, merge)
- And many more accounting entities

### Webhook Configuration
1. Webhooks must be configured in the Intuit Developer Portal
2. Separate endpoints for Production and Development environments
3. Requires OAuth 2.0 authentication
4. Verifier token provided for validating webhook signatures

### Webhook Payload Structure
```json
{
  "eventNotifications": [
    {
      "realmId": "company_id",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Payment",
            "id": "123",
            "operation": "Create",
            "lastUpdated": "2026-01-08T12:00:00Z"
          }
        ]
      }
    }
  ]
}
```

### Key Fields
- `name`: Entity type (Customer, Invoice, Payment, etc.)
- `id`: QuickBooks entity ID
- `operation`: Create, Update, Delete, Merge
- `lastUpdated`: Timestamp in UTC

### Best Practices
1. **Reliability**: Use ChangeDataCapture (CDC) calls to compensate for missed events
2. **Respond promptly**: Endpoint must respond within 3 seconds
3. **Async processing**: Process notifications on separate thread using a queue
4. **Manage concurrency**: Process queue linearly to avoid duplicate processing
5. **Notification ordering**: Events may arrive out of sequence; use timestamp as source of truth
6. **Retry policy**: Retries at 20, 30, 50 minutes; endpoint blacklisted after failures

### Signature Validation
- Hash payload with HMAC_SHA256 using verifier token as key
- Compare with `intuit-signature` header

## Implementation Strategy for Two-Way Payment Sync

### Option 1: Webhooks (Recommended)
- Configure webhook endpoint to receive Payment entity notifications
- When Payment is created/updated in QuickBooks, sync to SleekInvoices
- Requires setting up webhook endpoint in Intuit Developer Portal

### Option 2: Polling with CDC
- Periodically call ChangeDataCapture API for Payment entity
- Check for new/updated payments since last sync
- Less real-time but simpler to implement

### Recommended Approach
Use a hybrid approach:
1. Set up webhook endpoint for real-time notifications
2. Use daily CDC polling as backup to catch any missed events
3. Store last sync timestamp per user for CDC queries
