"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Settings, LogOut } from "lucide-react";
import { SidebarNavLinks } from "./app-sidebar";

interface AppHeaderProps {
  credits: number;
  fullName: string | null;
  avatarUrl: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppHeader({ credits, fullName, avatarUrl }: AppHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="md:hidden"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <SidebarNavLinks onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <img src="/logo.png" alt="SocialIA" className="h-10 w-auto md:h-28" />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm md:px-3">
          <span className="text-[#F26526]">✦</span>
          <span>{credits}</span>
          <span className="hidden sm:inline">créditos</span>
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8]/50">
            <Avatar>
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName ?? "Avatar"} />}
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="!w-auto min-w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{fullName ?? "Usuário"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 size-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
