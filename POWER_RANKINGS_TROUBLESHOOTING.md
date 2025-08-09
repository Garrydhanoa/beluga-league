# Power Rankings and Google Sheets Troubleshooting

## Common Issues and Solutions

### Authentication Issues with Google Sheets API on Vercel

If you're experiencing authentication issues with the Google Sheets API on Vercel, try these solutions:

#### Private Key Format Issues

The most common issue is with the private key formatting when stored in Vercel environment variables:

1. **Ensure the key is properly formatted**:
   - The key should include proper begin/end markers: `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - It should include actual newlines (`\n`) not escaped newlines (`\\n`)

2. **How to fix in Vercel**:
   - For multiline private keys, you need to configure them correctly in Vercel:
     - Using the Vercel CLI: Use the `--plain` flag when setting the environment variable
     - Using the Vercel dashboard: Use the "Insert from file" option

#### Special Handling for Majors Division

If the AA and AAA divisions work but Majors doesn't, the issue might be with how the sheet names are matched:

1. **Hard-coded sheet names**:
   - The code now includes hard-coded fallbacks for Majors sheet names (e.g., "Majors W1", "Majors W2", etc.)
   - Make sure your Google Sheet names match these conventions or update the `MAJORS_SHEET_NAMES` object

2. **Emergency fallback**:
   - If all else fails, the code will use a hardcoded fallback dataset for Majors division
   - This ensures users see something rather than an error

## Debugging

The code includes extensive debugging to help identify issues:

1. **Debug logs**:
   - Check Vercel logs for entries with `[POWER-RANKINGS-DEBUG]` and `[POWER-RANKINGS-ERROR]`
   - These will contain detailed information about what's happening

2. **Environment check**:
   - During build time, the script will check and log environment variables (without revealing secrets)
   - This can help identify if environment variables are set correctly

## Environment Variables Required

Make sure these environment variables are set in your Vercel project:

- `GOOGLE_CLIENT_EMAIL`: The email address from the Google service account
- `GOOGLE_PRIVATE_KEY`: The private key from the Google service account (must be properly formatted)
- `POWER_RANKINGS_SHEET_ID`: The ID of the Google Sheet containing power rankings

## Optional Division-Specific Sheet IDs

You can set division-specific sheet IDs as fallbacks:

- `MAJORS_SHEET_ID`: Specific sheet ID for Majors division
- `AA_SHEET_ID`: Specific sheet ID for AA division
- `AAA_SHEET_ID`: Specific sheet ID for AAA division
