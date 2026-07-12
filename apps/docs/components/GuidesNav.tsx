import {
  BookOpen,
  Hash,
  Headphones,
  Image,
  MessageSquare,
  Radio,
  Smile,
  Webhook,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { DocsSidebar, type SidebarGroup, type SidebarItem } from '@/components/PageShell';
import { CATEGORY_ORDER, getCategoryLabel } from '@/lib/guide-meta';
import { getAllGuides, getGuidesByCategory } from '@/lib/guides';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'getting-started': BookOpen,
  'sending-messages': MessageSquare,
  media: Image,
  channels: Hash,
  emojis: Smile,
  webhooks: Webhook,
  voice: Headphones,
  events: Radio,
  other: Wrench,
};

export function getGuidesSidebarItems(active?: string): SidebarItem[] {
  return getAllGuides().map((g) => ({
    href: `/guides/${g.slug}/`,
    label: g.title,
    active: g.slug === active,
  }));
}

export function getGuidesSidebarGroups(active?: string): SidebarGroup[] {
  const byCategory = getGuidesByCategory();
  return CATEGORY_ORDER.filter((cat) => (byCategory[cat]?.length ?? 0) > 0).map((cat) => {
    const Icon = CATEGORY_ICONS[cat] ?? Wrench;
    const list = byCategory[cat] ?? [];
    const hasActive = list.some((g) => g.slug === active);
    return {
      id: cat,
      label: getCategoryLabel(cat),
      icon: <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />,
      defaultOpen: hasActive || cat === 'getting-started',
      items: list.map((g) => ({
        href: `/guides/${g.slug}/`,
        label: g.title,
        active: g.slug === active,
      })),
    };
  });
}

export function GuidesNav({ active }: { active?: string }): React.ReactElement {
  return <DocsSidebar title="Guides" groups={getGuidesSidebarGroups(active)} />;
}
