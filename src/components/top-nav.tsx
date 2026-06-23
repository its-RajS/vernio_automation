"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Bell, Search, Plus, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  email: string;
  onMenuClick: () => void;
}

export function TopNav({ email, onMenuClick }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  const initials = email.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-6">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-md"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Search campaigns...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Bell className="h-4.5 w-4.5" />
          </button>

          {/* Create campaign */}
          <Link href="/projects/new">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create Campaign</span>
            </Button>
          </Link>

          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Search command dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search campaigns..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            <CommandItem
              onSelect={() => {
                setSearchOpen(false);
                router.push("/projects/new");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create new campaign</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setSearchOpen(false);
                router.push("/dashboard");
              }}
            >
              <span>Go to Dashboard</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
