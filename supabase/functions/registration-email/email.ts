// "You're in." registration confirmation, built from the Fremwork poster.
// Email-safe: tables, inline styles, PNG images (no SVG), web fonts with system fallbacks.

export interface EmailEvent {
  title: string;
  starts_at: string | null;
  when_label: string | null;
  length_label: string | null;
  location: string;
}

export interface EmailInput {
  name: string;
  event: EmailEvent;
  siteUrl: string; // e.g. https://www.fremwork.com (images are served from /email/)
  timeZone: string; // e.g. Africa/Addis_Ababa
  tzLabel: string; // e.g. EAT
  prep: string[]; // "Get ready" checklist
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SANS = "'Geist','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'Geist Mono','SFMono-Regular',Menlo,Consolas,'Courier New',monospace";

/** Date(s) and time line, e.g. "12–14 Nov 2026" and "09:00–13:40 EAT". */
export function schedule(ev: EmailEvent, timeZone: string, tzLabel: string) {
  if (!ev.starts_at) return { dates: ev.when_label || 'To be announced', time: '' };
  const start = new Date(ev.starts_at);
  const len = (ev.length_label || '').toLowerCase();
  const days = Number(len.match(/(\d+)\s*-?\s*day/)?.[1] || 1);
  const day = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone, ...o }).format(d);
  const end = new Date(start.getTime() + (days - 1) * 864e5);
  const dates =
    days > 1
      ? day(start, { month: 'short' }) === day(end, { month: 'short' })
        ? `${day(start, { day: 'numeric' })}–${day(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : `${day(start, { day: 'numeric', month: 'short' })} – ${day(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : day(start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const hm = (d: Date) => day(d, { hour: '2-digit', minute: '2-digit', hour12: false });
  const mins = len.match(/(\d+)\s*min/) ? Number(len.match(/(\d+)\s*min/)![1]) : len.match(/(\d+(?:\.\d+)?)\s*h/) ? Number(len.match(/(\d+(?:\.\d+)?)\s*h/)![1]) * 60 : 0;
  const time = mins ? `${hm(start)}–${hm(new Date(start.getTime() + mins * 60000))} ${tzLabel}` : `${hm(start)} ${tzLabel}`;
  return { dates, time };
}

export function subject(ev: EmailEvent) {
  return `You're in: ${ev.title}`;
}

export function renderHtml(i: EmailInput) {
  const { dates, time } = schedule(i.event, i.timeZone, i.tzLabel);
  const online = /online/i.test(i.event.location);
  const firstName = esc(i.name.trim() || 'there');
  const lead = online
    ? `You are registered for ${esc(i.event.title)}.<br>We will email the join link before ${dates.includes('–') ? 'Day 1' : 'it starts'}.`
    : `You are registered for ${esc(i.event.title)}.<br>See you at ${esc(i.event.location)}.`;
  const prep = i.prep
    .map(
      (p) => `<tr><td width="34" valign="top" style="padding:0 0 18px 0"><div style="width:20px;height:20px;border:2px solid #C6F432;box-sizing:border-box"></div></td>
      <td valign="top" style="padding:0 0 18px 0;font-family:${SANS};font-size:17px;line-height:22px;color:#E6E6E6">${esc(p)}</td></tr>`,
    )
    .join('');
  const img = (n: string) => `${i.siteUrl.replace(/\/+$/, '')}/email/${n}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject(i.event))}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
<style>@media (max-width:620px){.px{padding-left:24px!important;padding-right:24px!important}.big{font-size:64px!important;line-height:60px!important}.name{font-size:30px!important;line-height:36px!important}.col{display:block!important;width:100%!important;padding-bottom:20px!important}.hex{background-image:none!important}}</style>
</head>
<body style="margin:0;padding:0;background:#0A0A0A">
<div style="display:none;max-height:0;overflow:hidden">You're registered for ${esc(i.event.title)}. ${esc(dates)}${time ? ' · ' + esc(time) : ''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A"><tr><td align="center" style="padding:0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0A0A0A">

<tr><td class="px" style="padding:36px 36px 0 36px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle"><a href="${esc(i.siteUrl)}" style="text-decoration:none"><img src="${img('logo.png')}" width="160" alt="Fremwork" style="display:block;border:0;width:160px;height:auto"></a></td>
    <td valign="middle" align="right" style="font-family:${MONO};font-size:11px;letter-spacing:3px;color:#9A9A9A;text-transform:uppercase">Registration confirmed</td>
  </tr></table>
</td></tr>

<tr><td class="px hex" style="padding:56px 36px 0 36px;background-image:url('${img('hexagon.png')}');background-repeat:no-repeat;background-position:right 10px top 20px;background-size:360px auto">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="40" height="40" align="center" valign="middle" style="background:#C6F432;font-family:${SANS};font-size:22px;font-weight:700;color:#0A0A0A;line-height:40px">&#10003;</td></tr></table>
  <div class="big" style="margin:28px 0 0 0;font-family:${SANS};font-size:86px;line-height:78px;font-weight:700;letter-spacing:-4px;color:#FAFAFA">You&rsquo;re<br><span style="color:#C6F432">in.</span></div>
  <div style="margin:44px 0 0 0;font-family:${MONO};font-size:11px;letter-spacing:3px;color:#9A9A9A;text-transform:uppercase">Welcome</div>
  <div class="name" style="margin:8px 0 0 0;font-family:${SANS};font-size:38px;line-height:44px;font-weight:700;letter-spacing:-1.5px;color:#FFFFFF">${firstName}</div>
  <div style="margin:30px 0 0 0;font-family:${SANS};font-size:17px;line-height:27px;color:#CFCFCF">${lead}</div>
</td></tr>

<tr><td class="px" style="padding:36px 36px 0 36px"><div style="height:1px;background:#2B2B2B;line-height:1px;font-size:1px">&nbsp;</div></td></tr>

<tr><td class="px" style="padding:26px 36px 0 36px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td class="col" width="50%" valign="top">
      <div style="font-family:${MONO};font-size:11px;letter-spacing:3px;color:#9A9A9A;text-transform:uppercase">${dates.includes('–') ? 'Dates' : 'Date'}</div>
      <div style="margin-top:8px;font-family:${SANS};font-size:20px;line-height:26px;font-weight:700;color:#FFFFFF">${esc(dates)}</div>
    </td>
    ${time ? `<td class="col" width="50%" valign="top">
      <div style="font-family:${MONO};font-size:11px;letter-spacing:3px;color:#9A9A9A;text-transform:uppercase">${dates.includes('–') ? 'Daily time' : 'Time'}</div>
      <div style="margin-top:8px;font-family:${SANS};font-size:20px;line-height:26px;font-weight:700;color:#FFFFFF">${esc(time)}</div>
    </td>` : ''}
  </tr></table>
</td></tr>

${i.prep.length ? `<tr><td class="px" style="padding:36px 36px 8px 36px">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:3px;color:#C6F432;text-transform:uppercase;margin-bottom:18px">Get ready before ${dates.includes('–') ? 'Day 1' : 'the event'}</div>
  <table role="presentation" cellpadding="0" cellspacing="0">${prep}</table>
</td></tr>` : ''}

<tr><td style="padding:28px 0 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#C6F432"><tr>
    <td class="px" style="padding:24px 36px;font-family:${SANS};font-size:19px;line-height:24px;font-weight:700;letter-spacing:-0.4px;color:#0A0A0A">Think it. Build it. Test it. Improve it.</td>
    <td align="right" style="padding:24px 36px 24px 0;font-family:${MONO};font-size:11px;letter-spacing:3px;color:#0A0A0A;text-transform:uppercase;white-space:nowrap">${online ? 'See you online' : 'See you there'}</td>
  </tr></table>
</td></tr>

<tr><td class="px" style="padding:22px 36px 36px 36px;font-family:${SANS};font-size:12px;line-height:18px;color:#7A7A7A">
  You got this email because you registered on <a href="${esc(i.siteUrl)}/events" style="color:#9A9A9A">fremwork.com</a>. Can&rsquo;t make it? Open the Events page on the device you registered from and choose Cancel registration.
</td></tr>

</table></td></tr></table>
</body></html>`;
}

export function renderText(i: EmailInput) {
  const { dates, time } = schedule(i.event, i.timeZone, i.tzLabel);
  return [
    `You're in, ${i.name.trim() || 'there'}.`,
    '',
    `You are registered for ${i.event.title}.`,
    /online/i.test(i.event.location)
      ? `We will email the join link before ${dates.includes('–') ? 'Day 1' : 'it starts'}.`
      : `See you at ${i.event.location}.`,
    '',
    `${dates.includes('–') ? 'Dates' : 'Date'}: ${dates}`,
    time ? `${dates.includes('–') ? 'Daily time' : 'Time'}: ${time}` : '',
    '',
    i.prep.length ? 'Get ready:' : '',
    ...i.prep.map((p) => `- ${p}`),
    '',
    'Think it. Build it. Test it. Improve it.',
    'Fremwork',
  ].filter((l, k, a) => !(l === '' && a[k - 1] === '')).join('\n');
}
