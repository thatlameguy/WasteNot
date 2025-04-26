# Alert System

The WasteNot alert system automatically checks for food items that are about to expire and notifies users through both in-app alerts and email notifications.

## How It Works

1. **Alert Generation**: The system scans the database for food items that either:
   - Have already expired
   - Will expire within the next 3 days

2. **Notification Types**:
   - **In-App Alerts**: All identified items appear in the user's alerts dashboard
   - **Email Notifications**: Emails are sent for all items appearing in the alerts section

3. **Alert Information**:
   - Item name
   - Expiration date
   - Days remaining until expiration
   - Storage method
   - Current condition
   - Freshness indicator

## Automated Schedule

The alert generation runs automatically:
- Every day at midnight (00:00)
- When the server starts

## Manual Execution

To manually run the alert generation:

```bash
# From the backend directory
npm run generate-alerts
```

To run the cron job scheduler as a standalone process:

```bash
# From the backend directory
npm run cron
```

## Implementation Details

- Alerts are stored in the MongoDB database
- Emails are sent using Nodemailer
- The scheduler is implemented using node-cron
- Each alert tracks whether an email has been sent 