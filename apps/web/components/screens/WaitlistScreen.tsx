'use client';

import { Fragment } from 'react';
import { identifyVisitor } from '@/components/VisitTracker';
import Link from 'next/link';
import { FramSvg, type FramFace } from '@/components/fram/FramSvg';
import '@/styles/waitlist.css';
import { useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useFram } from '@/components/fram/useFram';
import { useMergeState } from '@/components/fram/useMergeState';
import { api, ApiError, type PublicSettings } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { EMAIL_RE } from '@/lib/format';

const ROLES = ['Business owner', 'Finance officer', 'Analyst', 'Accountant', 'Manager', 'Other'];

/** Join the waitlist · ported from Waitlist.dc.html, posts to the API. */
export function WaitlistScreen() {
  const [s, set, get] = useMergeState({
    name: '', company: '', email: '', role: '',
    nameErr: '', emailErr: '', roleErr: '', formErr: '',
    loading: false, done: false, askCompany: true, paused: false,
  });

  useEffect(() => {
    api<PublicSettings>('/settings/public')
      .then((p) => set({ askCompany: p.askCompany, paused: !p.acceptSignups }))
      .catch(() => {});
  }, [set]);

  const hasErr = !!(s.nameErr || s.emailErr || s.roleErr || s.formErr);
  const fram = useFram(s.done ? 'grin' : hasErr ? 'o' : '');

  const onSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const st = get();
    if (st.loading) return;
    const nm = st.name.trim();
    const em = st.email.trim();
    const errs = {
      nameErr: nm ? '' : 'Enter your name.',
      emailErr: !em ? 'Enter your work email.' : EMAIL_RE.test(em) ? '' : 'Enter a valid email, like you@company.com.',
      roleErr: st.role ? '' : 'Pick the role closest to yours.',
    };
    if (errs.nameErr || errs.emailErr || errs.roleErr) return set(errs);
    set({ loading: true, formErr: '' });
    try {
      const body = { name: nm, email: em, company: st.company.trim() || undefined, role: st.role };
      try {
        await api('/waitlist', { method: 'POST', body });
      } catch (err) {
        // API unreachable (status 0): save straight to Supabase with the same rules.
        if (!(err instanceof ApiError) || err.status !== 0) throw err;
        const { error } = await getSupabaseBrowserClient().rpc('join_waitlist', {
          p_name: body.name, p_email: body.email, p_company: body.company ?? null, p_role: body.role,
        });
        if (error) throw new Error(error.message);
      }
      identifyVisitor(em);
      set({ loading: false, done: true });
    } catch (err) {
      set({ loading: false, formErr: (err as Error).message });
    }
  };

  const nm = s.name.trim();
  // Template bindings for the ported markup (values mirror the design file's renderVals).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v: Record<string, any> = {
    ...fram,
    name: s.name, company: s.company, email: s.email,
    nameErr: s.nameErr, emailErr: s.emailErr, roleErr: s.roleErr || s.formErr,
    nameInvalid: s.nameErr ? 'true' : 'false', emailInvalid: s.emailErr ? 'true' : 'false',
    nameBorder: s.nameErr ? '#B42318' : '#E2E2DF', emailBorder: s.emailErr ? '#B42318' : '#E2E2DF',
    roles: ROLES.map((r) => {
      const on = s.role === r;
      return {
        label: r, pressed: on ? 'true' : 'false',
        pick: () => set({ role: r, roleErr: '', formErr: '' }),
        bg: on ? '#0A0A0A' : '#FFFFFF', color: on ? '#FFFFFF' : '#0A0A0A', border: on ? '#0A0A0A' : '#E2E2DF',
      };
    }),
    loading: s.loading,
    submitLabel: s.paused ? 'The waitlist is paused' : s.loading ? 'Joining…' : 'Join the waitlist',
    showForm: !s.done, done: s.done, askCompany: s.askCompany,
    firstName: nm ? nm.split(' ')[0] : 'friend',
    onName: (e: ChangeEvent<HTMLInputElement>) => set({ name: e.target.value, nameErr: '' }),
    onCompany: (e: ChangeEvent<HTMLInputElement>) => set({ company: e.target.value }),
    onEmail: (e: ChangeEvent<HTMLInputElement>) => set({ email: e.target.value, emailErr: '', formErr: '' }),
    onSubmit,
    onReset: () => set({ done: false, name: '', company: '', email: '', role: '' }),
  };

  return (
      <div className="pg-waitlist">
      <div className="auth-wrap" onMouseMove={v.onMove} onMouseEnter={v.onEnter} onMouseLeave={v.onLeave} style={{ minHeight: "100vh", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", fontFamily: "'Geist', system-ui, sans-serif", color: "#0A0A0A", background: "#E9E9E6" }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: "1080px", minHeight: "680px", display: "flex", background: "#FFFFFF", borderRadius: "22px", padding: "10px", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 24px 60px rgba(10,10,10,0.08)" }}>
      {/* Left visual panel */}
      <div className="lside" style={{ position: "relative", flex: "0 0 44%", borderRadius: "16px", overflow: "hidden", background: "#F1F1EC", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 30px 34px", boxSizing: "border-box" }}>
      <div aria-hidden="true" className="glow" style={{ position: "absolute", left: "-20%", top: "18%", width: "130%", height: "80%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(198,244,50,0.85), rgba(198,244,50,0.35) 55%, rgba(198,244,50,0) 100%)", filter: "blur(30px)" }}></div>
      <div aria-hidden="true" style={{ position: "absolute", right: "-25%", top: "-20%", width: "80%", height: "60%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))", filter: "blur(20px)" }}></div>
      <Link href="/" style={{ position: "relative", zIndex: "1", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "19px", letterSpacing: "-0.03em", textDecoration: "none", color: "#0A0A0A" }}><span aria-hidden="true" style={{ width: "14px", height: "14px", background: "#C6F432", boxShadow: "inset 0 0 0 2px #0A0A0A" }}></span>Fremwork</Link>
      <div style={{ position: "relative", zIndex: "1", width: "62%", alignSelf: "center", margin: "24px 0" }}>
      <FramSvg f={v as FramFace} label="Fram, the Fremwork character, waving" className="fram-svg" svgRef={v.setFram} onMouseDown={v.onPoke} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }} />
      </div>
      <div style={{ position: "relative", zIndex: "1" }}>
      <p style={{ margin: "0", fontSize: "14px", color: "#3A3A38" }}>Early access</p>
      <p style={{ margin: "10px 0 0", fontSize: "clamp(22px, 2.4vw, 28px)", lineHeight: "1.22", letterSpacing: "-0.02em", fontWeight: "500" }}>Be first to put a whole finance team in your chat.</p>
      </div>
      </div>
      {/* Right form panel */}
      <div className="auth-form" style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(28px, 4vw, 52px) clamp(20px, 5vw, 64px)" }}>
      <Link href="/" className="mob-brand" style={{ display: "none", alignSelf: "flex-start", alignItems: "center", gap: "8px", marginBottom: "28px", fontWeight: "600", fontSize: "19px", letterSpacing: "-0.03em", textDecoration: "none", color: "#0A0A0A" }}><span aria-hidden="true" style={{ width: "14px", height: "14px", background: "#C6F432", boxShadow: "inset 0 0 0 2px #0A0A0A" }}></span>Fremwork</Link>
      <div style={{ width: "100%", maxWidth: "400px" }}>
      {v.showForm ? (<>
      <div className="fade" style={{ display: "flex", flexDirection: "column" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><g stroke="#C6F432" strokeWidth="4.5" strokeLinecap="round"><path d="M15 3 V27"></path><path d="M4.6 9 L25.4 21"></path><path d="M4.6 21 L25.4 9"></path></g></svg>
      <h1 style={{ margin: "18px 0 0", fontSize: "30px", lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "600" }}>Join the waitlist</h1>
      <p style={{ margin: "10px 0 0", fontSize: "14px", lineHeight: "22px", color: "#8C8C8C" }}>We are letting businesses in a few at a time. Leave your details and we will email you when your spot opens.</p>
      <form onSubmit={v.onSubmit} noValidate style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      <div style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "7px" }}>
      <label htmlFor="wl-name" style={{ fontSize: "13px", fontWeight: "500" }}>Full name</label>
      <div className="field" style={{ background: "#FFFFFF", border: `1px solid ${v.nameBorder}`, borderRadius: "6px" }}><input id="wl-name" type="text" autoComplete="name" placeholder="Andrio John" value={v.name} onChange={v.onName} aria-invalid={v.nameInvalid} style={{ width: "100%", boxSizing: "border-box", border: "0", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: "#0A0A0A", padding: "12px 14px" }} /></div>
      {v.nameErr ? (<><span style={{ fontSize: "12px", color: "#B42318" }}>{v.nameErr}</span></>) : null}
      </div>
      {v.askCompany ? (<div style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "7px" }}>
      <label htmlFor="wl-company" style={{ fontSize: "13px", fontWeight: "500" }}>Company <span style={{ color: "#A3A3A0", fontWeight: "400" }}>(optional)</span></label>
      <div className="field" style={{ background: "#FFFFFF", border: "1px solid #EDEDED", borderRadius: "6px" }}><input id="wl-company" type="text" autoComplete="organization" placeholder="Your business" value={v.company} onChange={v.onCompany} style={{ width: "100%", boxSizing: "border-box", border: "0", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: "#0A0A0A", padding: "12px 14px" }} /></div>
      </div>) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <label htmlFor="wl-email" style={{ fontSize: "13px", fontWeight: "500" }}>Work email</label>
      <div className="field" style={{ background: "#FFFFFF", border: `1px solid ${v.emailBorder}`, borderRadius: "6px" }}><input id="wl-email" type="email" autoComplete="email" placeholder="you@company.com" value={v.email} onChange={v.onEmail} aria-invalid={v.emailInvalid} style={{ width: "100%", boxSizing: "border-box", border: "0", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: "#0A0A0A", padding: "12px 14px" }} /></div>
      {v.emailErr ? (<><span style={{ fontSize: "12px", color: "#B42318" }}>{v.emailErr}</span></>) : null}
      </div>
      <fieldset style={{ margin: "0", padding: "0", border: "0", display: "flex", flexDirection: "column", gap: "7px" }}>
      <legend style={{ padding: "0", marginBottom: "7px", fontSize: "13px", fontWeight: "500" }}>Your role</legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {(v.roles || []).map((r: any, r_i: number) => (<Fragment key={r_i}>
      <button type="button" className="chip" aria-pressed={r.pressed} onClick={r.pick} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: "500", color: r.color, background: r.bg, border: `1px solid ${r.border}`, borderRadius: "6px", padding: "7px 11px", cursor: "pointer" }}>{r.label}</button>
      </Fragment>))}
      </div>
      {v.roleErr ? (<><span style={{ fontSize: "12px", color: "#B42318" }}>{v.roleErr}</span></>) : null}
      </fieldset>
      <button type="submit" className="btn-dark" style={{ marginTop: "6px", width: "100%", minHeight: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "inherit", fontSize: "15px", fontWeight: "500", color: "#FFFFFF", background: "#0A0A0A", border: "0", borderRadius: "6px", padding: "12px 20px", cursor: "pointer", transition: "background .2s", boxShadow: "0 10px 24px rgba(10,10,10,0.22), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
      {v.loading ? (<><span className="spin" aria-hidden="true" style={{ width: "15px", height: "15px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFFFFF" }}></span></>) : null}
      {v.submitLabel}
      </button>
      </form>
      <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: "13px", color: "#8C8C8C" }}>Already have access? <Link href="/login" className="accent-lnk">Log in</Link></p>
      </div>
      </>) : null}
      {v.done ? (<>
      <div className="fade" role="status" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><g stroke="#C6F432" strokeWidth="4.5" strokeLinecap="round"><path d="M15 3 V27"></path><path d="M4.6 9 L25.4 21"></path><path d="M4.6 21 L25.4 9"></path></g></svg>
      <h1 style={{ margin: "18px 0 0", fontSize: "30px", lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "600" }}>Thanks, {v.firstName}.</h1>
      <p style={{ margin: "10px 0 0", fontSize: "14px", lineHeight: "22px", color: "#8C8C8C" }}>You are on the list. We will email <strong style={{ color: "#0A0A0A", fontWeight: "600" }}>{v.email}</strong> as soon as your spot opens.</p>
      <div style={{ marginTop: "22px", width: "100%", boxSizing: "border-box", background: "#FAFAF8", border: "1px solid #EDEDED", borderRadius: "10px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", fontWeight: "500", color: "#8C8C8C" }}>WHAT HAPPENS NEXT</span>
      <span style={{ fontSize: "14px", lineHeight: "21px" }}><strong style={{ fontWeight: "600" }}>1.</strong> We confirm your email.</span>
      <span style={{ fontSize: "14px", lineHeight: "21px" }}><strong style={{ fontWeight: "600" }}>2.</strong> We invite businesses in small groups.</span>
      <span style={{ fontSize: "14px", lineHeight: "21px" }}><strong style={{ fontWeight: "600" }}>3.</strong> You connect your accounts and ask your first question.</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px" }}>
      <Link href="/" className="btn-dark" style={{ textDecoration: "none", fontSize: "14px", fontWeight: "500", color: "#FFFFFF", background: "#0A0A0A", borderRadius: "6px", padding: "12px 20px" }}>Back to home</Link>
      <button type="button" className="sso" onClick={v.onReset} style={{ fontFamily: "inherit", fontSize: "14px", fontWeight: "500", color: "#0A0A0A", background: "#FAFAF8", border: "1px solid #EDEDED", borderRadius: "6px", padding: "11px 20px", cursor: "pointer" }}>Add someone else</button>
      </div>
      </div>
      </>) : null}
      <p style={{ margin: "22px 0 0", fontSize: "11px", lineHeight: "17px", color: "#A3A3A0", textAlign: "center" }}>We only use your details to contact you about Fremwork. Fremwork explains, analyses and recommends. It does not give regulated financial advice.</p>
      </div>
      </div>
      </div>
      </div>
      </div>
  );
}
