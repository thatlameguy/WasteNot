# Email Configuration Guide to Avoid Spam Folder

## Overview

Email notifications sent by applications are often filtered to spam folders by email providers. This guide provides steps to improve email deliverability for the WasteNot application.

## Environment Variables

Add these variables to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=WasteNot App
APP_NAME=WasteNot
APP_URL=http://yourdomain.com

# Optional: DKIM Authentication
DKIM_DOMAIN=yourdomain.com
DKIM_SELECTOR=default
DKIM_PRIVATE_KEY=your_dkim_private_key
```

## Steps to Avoid Spam Classification

1. **Use a Real Domain Email Address**
   - Instead of using free email services (Gmail, Yahoo, etc.), use an email address with your own domain
   - Example: `alerts@yourdomain.com` instead of `yourapp@gmail.com`

2. **Create SPF Records for Your Domain**
   - Add an SPF (Sender Policy Framework) record to your domain's DNS settings
   - Example SPF record: `v=spf1 include:_spf.google.com ~all`

3. **Set Up DKIM Authentication**
   - DKIM (DomainKeys Identified Mail) lets email providers verify your emails are legitimate
   - Generate DKIM keys and add them to your DNS records
   - Configure the application with your DKIM private key

4. **Set Up DMARC Policy**
   - Add a DMARC (Domain-based Message Authentication) record to your DNS
   - Example DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com`

5. **Use a Reputable Email Service**
   - Consider using dedicated email delivery services like:
     - SendGrid
     - Mailgun
     - Amazon SES

6. **Gmail-Specific Setup**
   - If using Gmail, create an "App Password" instead of your regular password
   - Go to: Google Account → Security → App Passwords → Create

7. **Ask Users to Add Your Email to Contacts**
   - Add a message in the app asking users to add your notification email address to their contacts
   - This helps build sender reputation with email providers

8. **Make "From" Address Consistent**
   - Always use the same sender email address

## Testing Email Delivery

1. Use tools like [mail-tester.com](https://www.mail-tester.com/) to check your spam score
2. Send test emails to multiple email providers (Gmail, Outlook, Yahoo)
3. Check the email headers to see if SPF, DKIM, and DMARC are passing

## Whitelist Instructions for Users

Include these instructions in your app to help users whitelist your email:

### Gmail
1. Open the email
2. Click the three dots in the top-right corner
3. Click "Filter messages like these"
4. Click "Create filter"
5. Check "Never send to Spam"
6. Click "Create filter"

### Outlook
1. Open the email
2. Right-click on the sender
3. Select "Add to contacts"

### Yahoo Mail
1. Open the email
2. Click the three dots
3. Select "Filter messages like this"
4. Choose "Always send to Inbox" 