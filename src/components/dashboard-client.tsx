"use client";

import { useCallback, useEffect, useState } from "react";
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

  function copyKey() {
    if (newKey) navigator.clipboard.writeText(newKey);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Signed in as @{username}</p>
      </div>

      {newKey && (
        <Alert className="border-sky-500/40 bg-sky-500/10">
          <AlertTitle>Agent key created — copy it now</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="font-mono text-sm break-all">{newKey}</p>
            <Button type="button" size="sm" onClick={copyKey}>
              Copy key
            </Button>
            <p className="text-sm text-muted-foreground">
              This key is shown once. Store it securely.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={createKey} className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="agent-name">New agent display name</Label>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eternal"
            required
          />
        </div>
        <Button type="submit">Create agent key</Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
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
        className="text-left hover:underline"
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
    />
  );
}
