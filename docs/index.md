# Privacy Policy for Verifeed

**Last Updated:** June 25, 2026

## What is Verifeed?

Verifeed is a browser extension that helps you fact-check claims on websites using AI-powered verification.

## What Data We Collect

### Data Sent to Our Servers
When you click on a highlighted claim to verify it, we send:
- **The claim text** (the sentence you clicked)
- **Page context**: URL, page title, site name, and surrounding text
- This data is sent to our verification API to analyze the claim

### Data Stored Locally
- Your settings (API endpoint, disabled sites list)
- Stored in your browser using Chrome's sync storage

### Data We Do NOT Collect
- We do NOT track your browsing history
- We do NOT collect personal information
- We do NOT sell your data to third parties
- We do NOT store verification history permanently

## Third-Party Services

### AI Processing
Claim verification uses **Groq AI** (Llama 3.3 70B model). When you verify a claim:
- The claim text and context are sent to Groq's API
- Groq processes the request and returns a verification result
- Groq's privacy policy: https://groq.com/privacy-policy/

### Caching
Verification results are cached temporarily (30 minutes) to:
- Improve response speed
- Reduce API costs
- Cache is cleared automatically

## Your Rights

You can:
- **Disable the extension** globally or per-site via Settings
- **View what data is sent** in your browser's Developer Console
- **Delete your data** by uninstalling the extension

## Data Retention

- **Verification cache**: Automatically deleted after 30 minutes
- **Your settings**: Stored until you uninstall the extension
- **Server logs**: Retained for 7 days for debugging purposes only

## Security

- All API requests use HTTPS encryption
- We do not store passwords or authentication tokens
- No user accounts required

## Changes to This Policy

We may update this policy. Changes will be posted with an updated "Last Updated" date.

## Contact

Questions? Issues? Contact us:
- GitHub: https://github.com/verifeed/verifeed
- Email: support@verifeed.app (if you set one up)

## Children's Privacy

Verifeed is not intended for children under 13. We do not knowingly collect data from children.

## Consent

By using Verifeed, you consent to this privacy policy.
