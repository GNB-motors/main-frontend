import LegDetail from './drawer/LegDetail.jsx';
import PlaceDetail from './drawer/PlaceDetail.jsx';
import StopsDetail from './drawer/StopsDetail.jsx';
import LiveIdleDetail from './drawer/LiveIdleDetail.jsx';
import IdleSpotDetail from './drawer/IdleSpotDetail.jsx';
import HotspotDetail from './drawer/HotspotDetail.jsx';
import DrainDetail from './drawer/DrainDetail.jsx';
import PlaceEditor from './drawer/PlaceEditor.jsx';

export default function PlaceHubDrawer({ selection, draft, ...props }) {
  if (draft) return <PlaceEditor draft={draft} {...props.editor} />;
  if (!selection?.item) return null;
  const { item, kind } = selection;
  const common = { canEdit: props.canEdit, onClose: props.onClose };
  if (kind === 'leg')
    return (
      <LegDetail
        key={item._id}
        leg={item}
        sites={props.routeSites}
        onClose={props.onClose}
        onPick={props.onPickRoute}
        onDetail={props.onRouteDetail}
        showEngine={props.showRouteEngine}
        onShowEngine={props.onShowRouteEngine}
        version={props.version}
      />
    );
  if (kind === 'place')
    return (
      <PlaceDetail
        place={item}
        {...common}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onReviewed={props.onReviewed}
      />
    );
  if (kind === 'live') return <LiveIdleDetail event={item} {...common} onAdd={props.onAdd} />;
  if (kind === 'idleSpot') return <IdleSpotDetail spot={item} {...common} onAdd={props.onAdd} />;
  if (kind === 'hotspot')
    return (
      <HotspotDetail
        hotspot={item}
        {...common}
        onEdit={props.onEdit}
        onToggle={props.onToggleHotspot}
      />
    );
  if (kind === 'drain')
    return (
      <DrainDetail cell={item} disclaimer={props.disclaimer} {...common} onAdd={props.onAdd} />
    );
  if (kind === 'stops')
    return (
      <StopsDetail
        group={item}
        site={props.siteOf(item.siteId)}
        {...common}
        busy={props.stopsBusy}
        onAnswer={props.onAnswerStops}
        onOpenSite={props.onOpenSite}
      />
    );
  return null;
}
