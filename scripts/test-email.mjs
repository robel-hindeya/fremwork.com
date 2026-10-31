// Run with: node scripts/test-email.mjs your-email@example.com
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const toEmail = process.argv[2];
if (!toEmail) {
  console.error('Please specify a destination email: node scripts/test-email.mjs you@domain.com');
  process.exit(1);
}

let apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  const envPath = path.join(__dirname, '../apps/api/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/RESEND_API_KEY\s*=\s*([^\r\n]+)/);
    if (match) apiKey = match[1].trim();
  }
}
if (!apiKey) {
  console.error('RESEND_API_KEY not found in environment or apps/api/.env');
  process.exit(1);
}
const templatePath = path.join(__dirname, '../apps/api/src/templates/registration-email.html');

if (!fs.existsSync(templatePath)) {
  console.error(`Template not found at ${templatePath}`);
  process.exit(1);
}

const rawTemplate = fs.readFileSync(templatePath, 'utf-8');
const html = rawTemplate
  .replace(/{{\s*participant_name\s*}}/g, 'Robel')
  .replace(/{{\s*dates\s*}}/g, 'Nov 10 – Nov 12, 2026');

const text = `Welcome Robel,\n\nYou are registered for the Fremwork 3-Day Vibe Coding Training.\nDates: Nov 10 – Nov 12, 2026\nDaily time: 09:00–13:40 EAT\n\nGet ready before Day 1:\n- A laptop or desktop and a stable internet connection\n- An AI tool account of your choice and a GitHub account\n- One small project idea you care about\n\nSee you online,\nFremwork Team\nhttps://fremwork.com`;

console.log(`Sending test email to ${toEmail}...`);

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Fremwork Support <support@fremwork.com>',
    to: [toEmail],
    subject: "You're in — Fremwork 3-Day Vibe Coding Training",
    html,
    text,
  }),
});

const result = await res.json();
if (res.ok) {
  console.log('✅ Email sent successfully! ID:', result.id);
} else {
  console.error('❌ Failed to send email:', result);
}
