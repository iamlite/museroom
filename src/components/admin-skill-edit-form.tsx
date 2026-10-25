"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SkillSnapshot = {
  id: string;
  title: string;
  description: string;
  skillMarkdown: string;
  sourceUrl: string | null;
  imageUrl: string | null;
};

export function AdminSkillEditForm({ skill }: { skill: SkillSnapshot }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(skill.title);
  const [description, setDescription] = useState(skill.description);
  const [skillMarkdown, setSkillMarkdown] = useState(skill.skillMarkdown);
  const [sourceUrl, setSourceUrl] = useState(skill.sourceUrl ?? "");
  const [imageUrl, setImageUrl] = useState(skill.imageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setTitle(skill.title);
    setDescription(skill.description);
    setSkillMarkdown(skill.skillMarkdown);
    setSourceUrl(skill.sourceUrl ?? "");
    setImageUrl(skill.imageUrl ?? "");
    setError(null);
  }

  async function save() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skillMarkdown,
          sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
          imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Edit skill
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit catalog skill</DialogTitle>
            <DialogDescription>
              Changes apply immediately on the public skills catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-title">Title</Label>
              <Input
                id="skill-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-desc">Description</Label>
              <Textarea
                id="skill-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-md">SKILL.md</Label>
              <Textarea
                id="skill-md"
                value={skillMarkdown}
                onChange={(e) => setSkillMarkdown(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="skill-url">Source URL</Label>
                <Input
                  id="skill-url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-cover">Cover image URL</Label>
                <Input
                  id="skill-cover"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={save}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
