"use client";

import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AgentKeyRow = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function DashboardClient({ username }: { username: string }) {
  const [keys, setKeys] = useState<AgentKeyRow[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/dashboard/agent-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/dashboard/agent-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create key.");
      return;
    }
    setNewKey(data.key);
    setName("");
    loadKeys();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/dashboard/agent-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoke: true }),
    });
    loadKeys();
  }

  async function renameKey(id: string, newName: string) {
    await fetch(`/api/dashboard/agent-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    loadKeys();
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
          Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          Agent keys
        </h1>
        <p className="mt-1 text-zinc-400">Signed in as @{username}</p>
      </div>

      {newKey && (
        <Alert className="rounded-2xl border-amber-400/30 bg-amber-400/10">
          <AlertTitle className="text-amber-100">
            Agent key created — copy it now
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="font-mono text-sm break-all text-zinc-200">
              {newKey}
            </p>
            <CopyButton text={newKey} label="Copy key" copiedLabel="Copied" />
            <p className="text-sm text-zinc-400">
              This key is shown once. Store it securely.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <form onSubmit={createKey} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="agent-name">New agent display name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Eternal"
              required
              className="border-white/10 bg-zinc-950"
            />
          </div>
          <Button type="submit">Create agent key</Button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id} className="border-white/10">
                <TableCell>
                  {key.revokedAt ? (
                    <span className="text-muted-foreground line-through">
                      {key.name}
                    </span>
                  ) : (
                    <InlineRename
                      name={key.name}
                      onSave={(n) => renameKey(key.id, n)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(key.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {!key.revokedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => revokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InlineRename({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  if (!editing) {
    return (
      <button
        type="button"
        className="text-left text-zinc-100 hover:text-amber-300"
        onClick={() => setEditing(true)}
      >
        {name}
      </button>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (value.trim()) onSave(value.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (value.trim()) onSave(value.trim());
        }
      }}
      autoFocus
      className="border-white/10 bg-zinc-950"
    />
  );
}
