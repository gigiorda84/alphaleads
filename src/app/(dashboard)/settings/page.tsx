"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import Button from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const supabase = createClient();

  /* ---- Profile state ---- */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ---- Apify state ---- */
  const [apifyKey, setApifyKey] = useState("");
  const [apifyShowKey, setApifyShowKey] = useState(false);
  const [apifyHasKey, setApifyHasKey] = useState(false);
  const [apifySaving, setApifySaving] = useState(false);
  const [apifyVerifying, setApifyVerifying] = useState(false);
  const [apifyVerifyResult, setApifyVerifyResult] = useState<
    "success" | "error" | null
  >(null);
  const [apifyMsg, setApifyMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ---- Password state ---- */
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ---- Delete account state ---- */
  const [deleting, setDeleting] = useState(false);

  /* ---- Loading ---- */
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------------- */
  /*  Fetch profile on mount                                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setFullName(p.full_name ?? "");
        setApifyHasKey(!!p.apify_api_token);
      }

      setLoading(false);
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  /** Save profile (name) */
  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    setProfileMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) {
      setProfileMsg({ type: "error", text: "Errore durante il salvataggio." });
    } else {
      setProfileMsg({ type: "success", text: "Profilo aggiornato con successo." });
    }
    setProfileSaving(false);
  };

  /** Verify Apify key */
  const handleVerifyApify = async () => {
    const keyToVerify = apifyKey || profile?.apify_api_token;
    if (!keyToVerify) return;

    setApifyVerifying(true);
    setApifyVerifyResult(null);

    try {
      const res = await fetch("/api/settings/verify-apify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToVerify }),
      });

      if (res.ok) {
        setApifyVerifyResult("success");
      } else {
        setApifyVerifyResult("error");
      }
    } catch {
      setApifyVerifyResult("error");
    }

    setApifyVerifying(false);
  };

  /** Save Apify key */
  const handleSaveApify = async () => {
    if (!profile || !apifyKey.trim()) return;
    setApifySaving(true);
    setApifyMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        apify_api_token: apifyKey.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setApifyMsg({ type: "error", text: "Errore durante il salvataggio." });
    } else {
      setApifyMsg({ type: "success", text: "API key salvata con successo." });
      setApifyHasKey(true);
    }
    setApifySaving(false);
  };

  /** Change password */
  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (!newPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Inserisci una nuova password." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "La password deve essere di almeno 6 caratteri.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Le password non coincidono." });
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMsg({
        type: "error",
        text: error.message || "Errore durante il cambio password.",
      });
    } else {
      setPasswordMsg({
        type: "success",
        text: "Password aggiornata con successo.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordSaving(false);
  };

  /** Delete account */
  const handleDeleteAccount = async () => {
    const first = window.confirm(
      "Sei sicuro di voler eliminare il tuo account? Tutti i dati verranno persi."
    );
    if (!first) return;

    const second = window.confirm(
      "Questa azione e irreversibile. Confermi di voler procedere con l'eliminazione?"
    );
    if (!second) return;

    setDeleting(true);

    // Sign out the user; actual account deletion should be handled server-side
    // via a Supabase Edge Function or admin API.
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* ---- Mask helper for existing key ---- */
  const maskedKey = (key: string | null) => {
    if (!key) return "";
    if (key.length <= 8) return "********";
    return key.slice(0, 4) + "****" + key.slice(-4);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-neutral-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-10 py-8">
      {/* Header */}
      <h1
        className="text-[26px] font-bold text-navy-800 mb-6"
        style={{ letterSpacing: "-0.02em" }}
      >
        Impostazioni
      </h1>

      <div className="flex flex-col gap-5">
        {/* ============================================================ */}
        {/*  Section: Profilo                                             */}
        {/* ============================================================ */}
        <div
          className="bg-white rounded-xl border border-neutral-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-base font-semibold text-navy-800 mb-5">
            Profilo
          </h2>

          {/* Full name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-[10px] rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700"
            />
          </div>

          {/* Email (disabled) */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-[10px] rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 cursor-not-allowed"
            />
          </div>

          {/* Feedback */}
          {profileMsg && (
            <p
              className={`text-sm mb-3 ${
                profileMsg.type === "success"
                  ? "text-green-600"
                  : "text-coral-600"
              }`}
            >
              {profileMsg.text}
            </p>
          )}

          <Button
            variant="primary"
            size="default"
            onClick={handleSaveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>

        {/* ============================================================ */}
        {/*  Section: API Key Apify                                       */}
        {/* ============================================================ */}
        <div
          className="bg-white rounded-xl border border-neutral-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-base font-semibold text-navy-800 mb-2">
            API Key Apify
          </h2>

          <p className="text-[13px] text-neutral-500 mb-5 leading-relaxed">
            Inserisci la tua API key Apify per collegare il servizio di lead
            generation. Puoi trovarla nella sezione Settings &gt; Integrations
            del tuo account Apify.
          </p>

          {/* API key input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={apifyShowKey ? "text" : "password"}
                value={apifyKey}
                onChange={(e) => {
                  setApifyKey(e.target.value);
                  setApifyVerifyResult(null);
                }}
                placeholder={
                  apifyHasKey
                    ? maskedKey(profile?.apify_api_token ?? null)
                    : "Inserisci la tua API key..."
                }
                className="w-full px-3 py-[10px] pr-10 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setApifyShowKey(!apifyShowKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {apifyShowKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Verify result */}
          {apifyVerifyResult && (
            <div
              className={`flex items-center gap-2 mb-4 text-sm ${
                apifyVerifyResult === "success"
                  ? "text-green-600"
                  : "text-coral-600"
              }`}
            >
              {apifyVerifyResult === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Connessione verificata</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>API key non valida</span>
                </>
              )}
            </div>
          )}

          {/* Feedback */}
          {apifyMsg && (
            <p
              className={`text-sm mb-3 ${
                apifyMsg.type === "success"
                  ? "text-green-600"
                  : "text-coral-600"
              }`}
            >
              {apifyMsg.text}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="default"
              onClick={handleVerifyApify}
              disabled={apifyVerifying || (!apifyKey.trim() && !apifyHasKey)}
            >
              {apifyVerifying ? "Verifica..." : "Verifica Connessione"}
            </Button>
            <Button
              variant="primary"
              size="default"
              onClick={handleSaveApify}
              disabled={apifySaving || !apifyKey.trim()}
            >
              {apifySaving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  Section: Sicurezza                                           */}
        {/* ============================================================ */}
        <div
          className="bg-white rounded-xl border border-neutral-200 p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-base font-semibold text-navy-800 mb-5">
            Sicurezza
          </h2>

          {/* New password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nuova Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Inserisci la nuova password"
              className="w-full px-3 py-[10px] rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Confirm password */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Conferma Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Conferma la nuova password"
              className="w-full px-3 py-[10px] rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Feedback */}
          {passwordMsg && (
            <p
              className={`text-sm mb-3 ${
                passwordMsg.type === "success"
                  ? "text-green-600"
                  : "text-coral-600"
              }`}
            >
              {passwordMsg.text}
            </p>
          )}

          <Button
            variant="secondary"
            size="default"
            onClick={handleChangePassword}
            disabled={passwordSaving}
          >
            {passwordSaving ? "Aggiornamento..." : "Cambia Password"}
          </Button>

          {/* Divider */}
          <div className="border-t border-neutral-200 my-6" />

          {/* Delete account */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">
              Elimina Account
            </h3>
            <p className="text-[13px] text-neutral-500 mb-4">
              Una volta eliminato, il tuo account e tutti i dati associati
              verranno rimossi permanentemente.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-5 py-[10px] rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors disabled:opacity-50"
              style={{
                background: "var(--coral-600)",
                boxShadow: "0 2px 8px rgba(234,84,85,0.25)",
              }}
            >
              {deleting ? "Eliminazione..." : "Elimina Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
