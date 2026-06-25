"use client";

import { useState, useEffect } from "react";
import { ShellHeader } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBrandProfiles, createBrandProfile, updateBrandProfile } from "../actions";
import type { User } from "@supabase/supabase-js";

interface BrandProfile {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  brand_prompt: string | null;
}

export function SettingsClient({ user }: { user: User }) {
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#2563EB");
  const [brandPrompt, setBrandPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadBrandProfiles();
  }, []);

  async function loadBrandProfiles() {
    setLoading(true);
    const { data, error } = await getBrandProfiles();
    if (!error && data) {
      setBrandProfiles(data as BrandProfile[]);
      if (data.length > 0) {
        const profile = data[0] as BrandProfile;
        setBrandName(profile.name);
        setPrimaryColor(profile.primary_color);
        setSecondaryColor(profile.secondary_color);
        setBrandPrompt(profile.brand_prompt || "");
        setEditingId(profile.id);
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!brandName.trim()) {
      alert("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await updateBrandProfile(editingId, {
          name: brandName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          brand_prompt: brandPrompt || null,
        });
        if (error) throw new Error(error);
      } else {
        const { data, error } = await createBrandProfile({
          name: brandName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          brand_prompt: brandPrompt || null,
        });
        if (error) throw new Error(error);
        if (data) {
          setEditingId((data as BrandProfile).id);
        }
      }
      await loadBrandProfiles();
      alert("Brand profile saved successfully");
    } catch (error) {
      alert(`Error saving brand profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input id="userId" value={user.id} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Brand Defaults Section */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Defaults</CardTitle>
          <CardDescription>Set default brand settings for new campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#8B5CF6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#2563EB"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandPrompt">Visual Style Prompt</Label>
            <textarea
              id="brandPrompt"
              value={brandPrompt}
              onChange={(e) => setBrandPrompt(e.target.value)}
              placeholder="Render style, lighting, materials, mood — e.g. 'Ultra-realistic 3D glassmorphism. Cinematic lighting. Premium enterprise aesthetic.' Do NOT include layout, positioning, or composition instructions — those are controlled by the template."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">Style and aesthetic only. Template controls all composition and layout — do not add positioning instructions here.</p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Brand Profile" : "Save Brand Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Theme Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
          <CardDescription>Customize your interface appearance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Dark mode is currently enabled and cannot be changed.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-11 rounded-full bg-primary relative cursor-not-allowed">
                <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-background" />
              </div>
            </div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            Theme preferences are managed at the application level. Contact support if you need light mode enabled.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
