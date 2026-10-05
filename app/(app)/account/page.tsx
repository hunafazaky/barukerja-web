"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { updateUser } from "@/lib/user.api";
import { ApiError } from "@/types/api";

const danger = { color: "var(--color-danger)" } as const;
const muted = { color: "var(--color-text-muted)" } as const;

function messageOf(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function ProfileSection() {
  const { user, getAccessToken, updateUser: setUser } = useAuth();
  const [name, setName] = useState(user?.display_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!user || !token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // "" clears a field; the API accepts it.
      const res = await updateUser(
        user.id,
        { display_name: name.trim(), bio: bio.trim() },
        token,
      );
      setUser(res.user);
      setSaved(true);
    } catch (err) {
      setError(messageOf(err, "Couldn't save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h2
        className="text-lg font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Profile
      </h2>
      <Field>
        <FieldLabel htmlFor="account-email">Email</FieldLabel>
        <Input id="account-email" value={user?.email ?? ""} disabled readOnly />
      </Field>
      <Field>
        <FieldLabel htmlFor="account-name">Display name</FieldLabel>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="account-bio">Bio</FieldLabel>
        <Textarea
          id="account-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
        />
      </Field>
      {error && <FieldDescription style={danger}>{error}</FieldDescription>}
      {saved && (
        <p
          role="status"
          className="text-sm"
          style={{ color: "var(--color-brand)" }}
        >
          Profile saved.
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

function PasswordSection() {
  const { user, getAccessToken } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!user || !token) return;
    setSaved(false);
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateUser(
        user.id,
        { password: next, currentPassword: current },
        token,
      );
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
    } catch (err) {
      setError(
        messageOf(err, "Couldn't change your password. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h2
        className="text-lg font-black"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Change password
      </h2>
      <Field>
        <FieldLabel htmlFor="current-password">Current password</FieldLabel>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="new-password">New password</FieldLabel>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <FieldDescription>
          At least 8 characters, with an uppercase letter, a lowercase letter
          and a number.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="confirm-new-password">
          Confirm new password
        </FieldLabel>
        <Input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      {error && <FieldDescription style={danger}>{error}</FieldDescription>}
      {saved && (
        <p
          role="status"
          className="text-sm"
          style={{ color: "var(--color-brand)" }}
        >
          Password changed.
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}

function DeleteSection() {
  const { user, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="max-w-lg space-y-3">
      <h2
        className="text-lg font-black"
        style={{ fontFamily: "var(--font-heading)", ...danger }}
      >
        Delete account
      </h2>
      <p className="text-sm" style={muted}>
        This permanently deletes your account
        {user?.role === "employer" ? " and every job you have posted" : ""}. It
        can&apos;t be undone.
      </p>
      {error && <FieldDescription style={danger}>{error}</FieldDescription>}
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description="Your account will be permanently deleted. This can't be undone."
        confirmLabel="Delete account"
        destructive
        onConfirm={async () => {
          setError(null);
          try {
            await deleteAccount();
          } catch (err) {
            setError(
              messageOf(err, "Couldn't delete your account. Please try again."),
            );
          }
        }}
      />
    </section>
  );
}

function AccountPageContent() {
  useDocumentTitle("Account");
  return (
    <>
      <PageHeader title="Account" />
      <div className="space-y-10">
        <ProfileSection />
        <PasswordSection />
        <DeleteSection />
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountPageContent />
    </RequireAuth>
  );
}
