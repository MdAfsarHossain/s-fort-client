"use client";

import { useState, type SubmitEvent } from "react";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEMBER_ROLES,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
} from "@/constants/members";
import {
  useCreateMemberMutation,
  useUpdateMemberMutation,
  type Member,
  type MemberRole,
  type MemberStatus,
  type MemberUpdateInput,
} from "@/redux/api/memberApi";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
}: MemberFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Update this member's account details."
              : "Create a new admin, manager, or editor account."}
          </DialogDescription>
        </DialogHeader>
        <MemberForm
          key={open ? (member?.id ?? "new") : "closed"}
          member={member}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function diffMemberFields(
  original: Member,
  next: {
    name: string;
    email: string;
    role: MemberRole;
    status: MemberStatus;
    twitter: string;
    linkedin: string;
  }
): MemberUpdateInput {
  const diff: MemberUpdateInput = {};

  if (next.name !== original.name) diff.name = next.name;
  if (next.email !== original.email) diff.email = next.email;
  if (next.role !== original.role) diff.role = next.role;
  if (next.status !== original.status) diff.status = next.status;
  if (next.twitter !== (original.twitter ?? "")) diff.twitter = next.twitter;
  if (next.linkedin !== (original.linkedin ?? ""))
    diff.linkedin = next.linkedin;

  return diff;
}

function MemberForm({
  member,
  onSaved,
  onCancel,
}: {
  member?: Member | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!member;
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<MemberRole>(member?.role ?? "EDITOR");
  const [status, setStatus] = useState<MemberStatus>(
    member?.status ?? "ACTIVE"
  );
  const [twitter, setTwitter] = useState(member?.twitter ?? "");
  const [linkedin, setLinkedin] = useState(member?.linkedin ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const avatarSrc = avatarPreviewUrl ?? member?.avatar ?? null;

  const [createMember, { isLoading: isCreating }] = useCreateMemberMutation();
  const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation();
  const isSubmitting = isCreating || isUpdating;

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (isEditing && member) {
        const fields = diffMemberFields(member, {
          name,
          email,
          role,
          status,
          twitter,
          linkedin,
        });
        if (Object.keys(fields).length === 0 && !avatarFile) {
          onSaved();
          return;
        }
        await updateMember({
          id: member.id,
          fields,
          avatar: avatarFile ?? undefined,
        }).unwrap();
        toast.success("Member updated");
      } else {
        await createMember({
          fields: { name, email, password, role, twitter, linkedin },
          avatar: avatarFile ?? undefined,
        }).unwrap();
        toast.success("Member created");
      }
      onSaved();
    } catch {
      toast.error(
        isEditing ? "Failed to update member" : "Failed to create member"
      );
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!avatarSrc}
          onClick={() => setIsPreviewOpen(true)}
          className="rounded-full disabled:cursor-default"
          aria-label={avatarSrc ? "View full-size photo" : undefined}
        >
          <Avatar size="lg" className={avatarSrc ? "cursor-pointer" : undefined}>
            <AvatarImage src={avatarSrc ?? undefined} />
            <AvatarFallback>{name ? getInitials(name) : "?"}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="member-avatar"
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <CameraIcon className="size-4" />
            {avatarSrc ? "Change photo" : "Upload photo"}
          </Label>
          <Input
            id="member-avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-name">Name</Label>
        <Input
          id="member-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-email">Email</Label>
        <Input
          id="member-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member-password">Password</Label>
          <Input
            id="member-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-role">Role</Label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as MemberRole)}
        >
          <SelectTrigger id="member-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEMBER_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {MEMBER_ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-twitter">Twitter</Label>
        <Input
          id="member-twitter"
          type="url"
          placeholder="https://twitter.com/username"
          value={twitter}
          onChange={(event) => setTwitter(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-linkedin">LinkedIn</Label>
        <Input
          id="member-linkedin"
          type="url"
          placeholder="https://linkedin.com/in/username"
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
        />
      </div>
      {isEditing && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as MemberStatus)}
          >
            <SelectTrigger id="member-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {MEMBER_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isEditing ? "Save changes" : "Create member"}
        </Button>
      </DialogFooter>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-md">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {avatarSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- externally hosted URL or local object URL preview, not a local/optimizable asset
            <img
              src={avatarSrc}
              alt=""
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
