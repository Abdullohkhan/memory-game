import { useState } from "react";
import { validNickname } from "@memory/core";
import { errorText } from "../hooks/useAccount";
import type { useAccount } from "../hooks/useAccount";
import type { T } from "../hooks/useSettings";
import { GoogleButton } from "./GoogleButton";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  account: ReturnType<typeof useAccount>;
  t: T;
  onClose: () => void;
}

export function AccountDialog({ open, account, t, onClose }: Props) {
  const { user } = account;
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      after?.();
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const value = nickname.trim() || (user?.nickname ?? "");
  const canSubmit = validNickname(nickname) && !busy;

  return (
    <Modal open={open} onClose={onClose} label={t("account")}>
      <h2>{t("account")}</h2>

      {user ? (
        <>
          <p>
            {t("signedInAs")} <strong>{user.nickname}</strong>
          </p>
          <form
            className="field"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) void run(() => account.rename(nickname), () => setNickname(""));
            }}
          >
            <label htmlFor="nick-edit">{t("nickname")}</label>
            <div className="field-row">
              <input id="nick-edit" value={nickname} placeholder={value} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
              <button type="submit" className="btn" disabled={!canSubmit}>
                {t("save")}
              </button>
            </div>
          </form>
          {user.hasGoogle ? <p className="hint">✔ {t("googleLinked")}</p> : <GoogleButton text="continue_with" onCredential={(c) => void run(() => account.signInGoogle(c))} />}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="btn" onClick={() => void run(account.signOut, onClose)}>
            {t("signOut")}
          </button>
        </>
      ) : (
        <>
          <p className="hint">{t("accountHint")}</p>
          <form
            className="field"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) void run(() => account.signInGuest(nickname), () => setNickname(""));
            }}
          >
            <label htmlFor="nick-new">{t("nickname")}</label>
            <input id="nick-new" value={nickname} maxLength={20} autoComplete="nickname" onChange={(e) => setNickname(e.target.value)} aria-describedby="nick-hint" />
            <small id="nick-hint">{t("nicknameHint")}</small>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {t("continueNickname")}
            </button>
          </form>
          <GoogleButton text="signin_with" onCredential={(c) => void run(() => account.signInGoogle(c))} />
          {error && <p className="form-error" role="alert">{error}</p>}
        </>
      )}

      <button type="button" className="btn" onClick={onClose}>
        {t("close")}
      </button>
    </Modal>
  );
}
