import { registerComponentDecorator, useStore } from '@workflowbuilder/sdk';

import type { RunStore } from './run-store';

// The SDK invokes 'before'/'after' decorator content as <Content props={hostProps} />
// — the host's props (including nodeId) are nested under a prop named `props`,
// not spread directly onto this component. Confirmed by reading the compiled
// bundle (registerComponentDecorator's 'after' branch), not just the .d.ts.
type BadgeProps = { props: { nodeId: string } };

// Builds a domain's live-status-highlight plugin: a green glowing ring drawn
// around whichever canvas node's palette `type` matches the domain's
// currently-polled phase (from its run-store). `phaseToNodeType` maps that
// domain's workflow phase strings (see its GetStatus query) to node types —
// the only thing a new domain needs to supply to get this feature.
export function createLiveHighlightPlugin(useRunStore: RunStore, phaseToNodeType: Record<string, string>, pluginName: string) {
  function LiveHighlightBadge({ props }: BadgeProps) {
    const { nodeId } = props;
    const nodeType = useStore((s) => s.nodes.find((n) => n.id === nodeId)?.data.type);
    const currentPhase = useRunStore((s) => s.currentPhase);

    const isLive = !!currentPhase && !!nodeType && phaseToNodeType[currentPhase] === nodeType;
    if (!isLive) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 10,
          border: '2px solid #16a34a',
          boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.25)',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return function liveHighlightPlugin(): void {
    registerComponentDecorator('OptionalNodeContent', {
      content: LiveHighlightBadge,
      place: 'after',
      name: pluginName,
    });
  };
}
