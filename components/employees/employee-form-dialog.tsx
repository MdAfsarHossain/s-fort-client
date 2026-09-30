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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  type Employee,
  type EmployeeUpdateInput,
} from "@/redux/api/employeeApi";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? "Update this employee's profile details."
              : "Add a new team member profile."}
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm
          key={open ? (employee?.id ?? "new") : "closed"}
          employee={employee}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function diffEmployeeFields(
  original: Employee,
  next: {
    name: string;
    designation: string;
    bio: string;
    twitter: string;
    linkedin: string;
  }
): EmployeeUpdateInput {
  const diff: EmployeeUpdateInput = {};

  if (next.name !== original.name) diff.name = next.name;
  if (next.designation !== original.designation)
    diff.designation = next.designation;
  if (next.bio !== (original.bio ?? "")) diff.bio = next.bio;
  if (next.twitter !== (original.twitter ?? "")) diff.twitter = next.twitter;
  if (next.linkedin !== (original.linkedin ?? ""))
    diff.linkedin = next.linkedin;

  return diff;
}

function EmployeeForm({
  employee,
  onSaved,
  onCancel,
}: {
  employee?: Employee | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!employee;
  const [name, setName] = useState(employee?.name ?? "");
  const [designation, setDesignation] = useState(
    employee?.designation ?? ""
  );
  const [bio, setBio] = useState(employee?.bio ?? "");
  const [twitter, setTwitter] = useState(employee?.twitter ?? "");
  const [linkedin, setLinkedin] = useState(employee?.linkedin ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const imageSrc = imagePreviewUrl ?? employee?.image ?? null;

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] =
    useUpdateEmployeeMutation();
  const isSubmitting = isCreating || isUpdating;

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (isEditing && employee) {
        const fields = diffEmployeeFields(employee, {
          name,
          designation,
          bio,
          twitter,
          linkedin,
        });
        if (Object.keys(fields).length === 0 && !imageFile) {
          onSaved();
          return;
        }
        await updateEmployee({
          id: employee.id,
          fields,
          image: imageFile ?? undefined,
        }).unwrap();
        toast.success("Employee updated");
      } else {
        await createEmployee({
          fields: { name, designation, bio, twitter, linkedin },
          image: imageFile ?? undefined,
        }).unwrap();
        toast.success("Employee created");
      }
      onSaved();
    } catch {
      toast.error(
        isEditing ? "Failed to update employee" : "Failed to create employee"
      );
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!imageSrc}
          onClick={() => setIsPreviewOpen(true)}
          className="rounded-full disabled:cursor-default"
          aria-label={imageSrc ? "View full-size photo" : undefined}
        >
          <Avatar size="lg" className={imageSrc ? "cursor-pointer" : undefined}>
            <AvatarImage src={imageSrc ?? undefined} />
            <AvatarFallback>{name ? getInitials(name) : "?"}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="employee-image"
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <CameraIcon className="size-4" />
            {imageSrc ? "Change photo" : "Upload photo"}
          </Label>
          <Input
            id="employee-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-name">Name</Label>
        <Input
          id="employee-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-designation">Designation</Label>
        <Input
          id="employee-designation"
          required
          placeholder="e.g. Senior Frontend Developer"
          value={designation}
          onChange={(event) => setDesignation(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-bio">Bio</Label>
        <Textarea
          id="employee-bio"
          placeholder="Short bio..."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-twitter">Twitter</Label>
        <Input
          id="employee-twitter"
          type="url"
          placeholder="https://twitter.com/username"
          value={twitter}
          onChange={(event) => setTwitter(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-linkedin">LinkedIn</Label>
        <Input
          id="employee-linkedin"
          type="url"
          placeholder="https://linkedin.com/in/username"
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isEditing ? "Save changes" : "Create employee"}
        </Button>
      </DialogFooter>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-md">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- externally hosted URL or local object URL preview, not a local/optimizable asset
            <img
              src={imageSrc}
              alt=""
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
