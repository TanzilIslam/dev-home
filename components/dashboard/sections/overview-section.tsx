"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Code, Copy, ExternalLink, FolderKanban, Link2, Plus, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useAppStore } from "@/store/use-app-store";
import { joinLabels } from "@/lib/constants/domain";
import { listFiles, listLinks } from "@/lib/api/client";
import { viewFile } from "@/lib/upload/download";
import { useCancellableFetch } from "@/hooks/use-cancellable-fetch";
import type { FileItem, LinkItem } from "@/types/domain";

// ---------------------------------------------------------------------------
// Reusable scrollable tabs wrapper
// ---------------------------------------------------------------------------

function ScrollableTabs({ items, children }: {
  items: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, items]);

  function scroll(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="relative flex items-center gap-1">
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => scroll("left")}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
          <TabsList className="w-max">
            {items.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="cursor-pointer">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => scroll("right")}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
      {children}
    </>
  );
}

// ---------------------------------------------------------------------------
// Link list
// ---------------------------------------------------------------------------

type LinkListProps = {
  links: LinkItem[];
  emptyMessage: string;
  getLabel: (link: LinkItem) => string;
};

function LinkList({ links, emptyMessage, getLabel }: LinkListProps) {
  if (links.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Failed to copy"),
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.id} className="flex min-w-0 items-center gap-1 border-b py-2">
          <span className="min-w-0 flex-1 truncate text-sm">{getLabel(link)}</span>
          <button
            type="button"
            onClick={() => copyUrl(link.url)}
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Copy link"
          >
            <Copy className="size-3.5" />
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Codebase links card with project tabs
// ---------------------------------------------------------------------------

function CodebaseLinksCard({ links }: { links: LinkItem[] }) {
  const projectGroups = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; links: LinkItem[] }>();
    for (const link of links) {
      if (!link.projectId) continue;
      let group = map.get(link.projectId);
      if (!group) {
        group = { projectId: link.projectId, projectName: link.projectName ?? "Unknown", links: [] };
        map.set(link.projectId, group);
      }
      group.links.push(link);
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => a.projectName.localeCompare(b.projectName));
    for (const g of groups) {
      g.links.sort((a, b) => a.title.localeCompare(b.title));
    }
    return groups;
  }, [links]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Codebase</CardTitle>
      </CardHeader>
      <CardContent>
        {projectGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No codebase-level links.</p>
        ) : (
          <Tabs defaultValue={projectGroups[0].projectId}>
            <ScrollableTabs items={projectGroups.map((g) => ({ id: g.projectId, label: g.projectName }))}>
              {projectGroups.map((group) => (
                <TabsContent key={group.projectId} value={group.projectId}>
                  <LinkList
                    links={group.links}
                    emptyMessage="No links."
                    getLabel={(l) => joinLabels(l.codebaseName, l.title)}
                  />
                </TabsContent>
              ))}
            </ScrollableTabs>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Client tab content (3 cards)
// ---------------------------------------------------------------------------

function ClientTabContent({ clientId }: { clientId: string }) {
  const fetchLinks = useCallback(
    (id: string) => listLinks({ clientId: id, all: true }).then((d) => d.items),
    [],
  );
  const fetchFiles = useCallback(
    (id: string) => listFiles({ clientId: id, all: true }).then((d) => d.items),
    [],
  );

  const { data: links, isLoading: linksLoading } = useCancellableFetch<LinkItem[]>(clientId, fetchLinks);
  const { data: files, isLoading: filesLoading } = useCancellableFetch<FileItem[]>(clientId, fetchFiles);

  const { clientLinks, projectLinks, codebaseLinks } = useMemo(() => {
    const client: LinkItem[] = [];
    const project: LinkItem[] = [];
    const codebase: LinkItem[] = [];
    for (const link of links ?? []) {
      if (link.codebaseId) {
        codebase.push(link);
      } else if (link.projectId) {
        project.push(link);
      } else {
        client.push(link);
      }
    }
    const sort = (a: LinkItem, b: LinkItem) => a.title.localeCompare(b.title);
    client.sort(sort);
    project.sort(sort);
    codebase.sort(sort);
    return { clientLinks: client, projectLinks: project, codebaseLinks: codebase };
  }, [links]);

  if (linksLoading || filesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
      <CodebaseLinksCard links={codebaseLinks} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Project</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkList links={projectLinks} emptyMessage="No project-level links." getLabel={(l) => joinLabels(l.projectName, l.title)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Client</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkList links={clientLinks} emptyMessage="No client-level links." getLabel={(l) => l.title} />
          {(files ?? []).length > 0 && (
            <>
              <div className="my-3 border-t" />
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Files</p>
              <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {(files ?? []).map((file) => (
                  <li key={file.id} className="flex min-w-0 items-center gap-1 border-b py-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{file.filename}</span>
                    <button
                      type="button"
                      onClick={() => viewFile(file.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      aria-label={`View ${file.filename}`}
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview section
// ---------------------------------------------------------------------------

export function OverviewSection() {
  const { clientOptions } = useDashboard();

  const setActiveSection = useAppStore((state) => state.setActiveSection);

  if (clientOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
          <Users className="text-muted-foreground size-7" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">No data yet</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm leading-relaxed">
          Start by adding your first client. Then organize projects, codebases, and links under it.
        </p>
        <Button className="mt-6 cursor-pointer" onClick={() => setActiveSection("clients")}>
          <Plus className="mr-2 size-4" />
          Add your first client
        </Button>

        <div className="mt-12 grid w-full max-w-lg grid-cols-3 gap-4">
          {[
            { icon: FolderKanban, label: "Projects" },
            { icon: Code, label: "Codebases" },
            { icon: Link2, label: "Links" },
          ].map((item) => (
            <div
              key={item.label}
              className="border-border bg-card flex flex-col items-center gap-2 rounded-xl border border-dashed p-5"
            >
              <item.icon className="text-muted-foreground/50 size-5" />
              <span className="text-muted-foreground text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={clientOptions[0].id}>
          <ScrollableTabs items={clientOptions}>
            {clientOptions.map((client) => (
              <TabsContent key={client.id} value={client.id}>
                <ClientTabContent clientId={client.id} />
              </TabsContent>
            ))}
          </ScrollableTabs>
        </Tabs>
      </CardContent>
    </Card>
  );
}
