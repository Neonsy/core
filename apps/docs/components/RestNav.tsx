import { DocsSidebar, type SidebarGroup, type SidebarItem } from '@/components/PageShell';
import { getOperationsByTag } from '@/lib/openapi';

export function getRestSidebarItems(activeId?: string): SidebarItem[] {
  const byTag = getOperationsByTag();
  return Object.values(byTag).flatMap((ops) =>
    ops.map((op) => ({
      href: `/rest/${op.operationId}/`,
      label: op.summary || op.path,
      badge: op.method,
      active: op.operationId === activeId,
    })),
  );
}

export function getRestSidebarGroups(activeId?: string): SidebarGroup[] {
  const byTag = getOperationsByTag();
  return Object.entries(byTag).map(([tag, ops]) => {
    const hasActive = ops.some((op) => op.operationId === activeId);
    return {
      id: tag,
      label: tag,
      defaultOpen: hasActive || !activeId,
      items: ops.map((op) => ({
        href: `/rest/${op.operationId}/`,
        label: op.summary || op.path,
        badge: op.method,
        active: op.operationId === activeId,
      })),
    };
  });
}

export function RestNav({ activeId }: { activeId?: string }): React.ReactElement {
  return <DocsSidebar title="REST API" groups={getRestSidebarGroups(activeId)} />;
}
