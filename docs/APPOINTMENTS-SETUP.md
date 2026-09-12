# Appointment requests — how they are delivered

The site is static (Vercel, no backend), so a submitted appointment goes two places:

1. **WhatsApp** — opens prefilled, addressed to the store the visitor selected.
   This is the guaranteed path and needs no setup. It already works.
2. **A Google Sheet** — the durable record, written through a Google Apps Script
   web app. This needs the ten-minute setup below.

Until step 2 is done the Sheet write is skipped silently and WhatsApp still works.

## Routing

| Store selected | WhatsApp number |
| --- | --- |
| Raipur (Sadar Bazar) | +91 958 441 1144 |
| Durg (Shree Shivam Mall) | +91 924 450 9870 |

Numbers live in `STORE_WHATSAPP` at the top of the appointment block in
`assets/js/main.js`.

## Setting up the Google Sheet

1. Create a new Google Sheet, named e.g. *Saheli Aurum — Appointments*.
2. **Extensions → Apps Script**. Delete the placeholder and paste the script below.
3. **Deploy → New deployment → Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**   ← required; the site posts without a Google login
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into `SHEET_ENDPOINT` in `assets/js/main.js`:
   ```js
   var SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
   ```
6. Bump the `?v=` number on the `main.js` tags in the HTML so browsers refetch it,
   then redeploy (`vercel --prod`).

The Content-Security-Policy in `vercel.json` already allows `script.google.com`
and `script.googleusercontent.com` under `connect-src`. Without those the browser
blocks the write with no visible error, so leave them in place.

## The Apps Script

```js
// Set this once the client provides an address, and appointments will also
// arrive by email. Leave empty to log to the Sheet only.
var NOTIFY_EMAIL = '';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);                     // two submissions at once must not collide
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Appointments') || ss.insertSheet('Appointments');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Received', 'Name', 'Phone', 'Store',
                       'Consultation', 'Notes', 'Page', 'Submitted (browser)']);
      sheet.setFrozenRows(1);
    }

    var d = JSON.parse(e.postData.contents);
    sheet.appendRow([new Date(), d.name || '', d.phone || '', d.store || '',
                     d.type || '', d.note || '', d.page || '', d.submittedAt || '']);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Appointment request — ' + (d.name || 'unknown') + ' (' + (d.store || '-') + ')',
        body: [
          'Name: ' + (d.name || '-'),
          'Phone: ' + (d.phone || '-'),
          'Store: ' + (d.store || '-'),
          'Consultation: ' + (d.type || '-'),
          'Notes: ' + (d.note || '-'),
          '',
          'Submitted from ' + (d.page || '-')
        ].join('\n')
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## Adding email later

Two options once the client shares an address:

- **Simplest** — set `NOTIFY_EMAIL` in the Apps Script above and save. Nothing on
  the website changes, and no redeploy is needed.
- **Or** add a `to` address on a transactional service (Resend, SendGrid) behind a
  Vercel serverless function. Only worth it if volume grows or the Sheet is dropped.

## Why the request is sent this way

`navigator.sendBeacon` is tried first because it survives the page navigating to
WhatsApp; `fetch` with `keepalive` is the fallback. Both send `text/plain`, which
keeps the request CORS-simple so Apps Script never receives a preflight it cannot
answer. Neither can read the response, which is fine — the Sheet is a log, and the
visitor's confirmation depends on WhatsApp, not on this call succeeding.
