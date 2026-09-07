import type { PaletteItem, PaletteItemOrGroup } from '@workflowbuilder/sdk';

import { ALL_DOMAINS } from './domain-registry';

// Every node type any registered domain contributes. No domain-specific
// imports here — this is built purely by flattening ALL_DOMAINS, so it
// automatically picks up whatever domains are registered.
export const ALL_PALETTE_ITEMS = ALL_DOMAINS.flatMap((domain) => domain.paletteItems) as PaletteItem[];

const PALETTE_ITEMS_BY_TYPE: Record<string, PaletteItem> = Object.fromEntries(
  ALL_PALETTE_ITEMS.map((item) => [item.type, item]),
);

export function resolvePaletteItems(typeKeys: string[]): PaletteItemOrGroup[] {
  return typeKeys.map((key) => PALETTE_ITEMS_BY_TYPE[key]).filter((item): item is PaletteItem => !!item);
}
