import * as React from "react";
import * as RN from "react-native";
import { Stores } from "@valenced/discord/flux";
import { getModules } from "@valenced/modules/finders";
import {
  createFilterGenerator,
  FilterScopes,
  withProps,
} from "@valenced/modules/finders/filters";
import { instead as nativeInstead } from "@valenced/patcher";
import { createPluginStore } from "./settings-store";

type Element = React.ReactElement<any>;
type NativeTarget = { id: string; tag: number };
type Runtime = {
  running: boolean;
  renderer: React.ComponentType<any> | null;
  target: NativeTarget | null;
  attached: boolean;
  reduceTransparency: boolean;
};
export const useSettings = createPluginStore("liquid-glass-youbar", {
  enabled: true,
  blur: true,
  highlights: true,
  finish: "balanced",
}).useStore;
export const finishes = {
  subtle: { label: "Subtle", blur: 10, opacity: 0.25 },
  balanced: { label: "Balanced", blur: 16, opacity: 0.42 },
  frosted: { label: "Frosted", blur: 24, opacity: 0.66 },
} as const;
let runtime: Runtime = {
  running: false,
  renderer: null,
  target: null,
  attached: false,
  reduceTransparency: false,
};
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
const snapshot = () => runtime;
export const useRuntime = () =>
  React.useSyncExternalStore(subscribe, snapshot, snapshot);
function update(patch: Partial<Runtime>) {
  if (
    Object.entries(patch).every(
      ([key, value]) => runtime[key as keyof Runtime] === value,
    )
  )
    return;
  runtime = { ...runtime, ...patch };
  for (const listener of listeners) listener();
}
const cleanups: (() => void)[] = [];
let generation = 0;
let targetSequence = 0;
let wrappers = new WeakMap<Function, React.ComponentType<any>>();
const targets = new Map<object, NativeTarget>();
function setTarget(owner: object, target: NativeTarget | null) {
  if (target && runtime.running) targets.set(owner, target);
  else targets.delete(owner);
  const next = Array.from(targets.values()).at(-1) || null;
  if (runtime.target?.id !== next?.id || runtime.target?.tag !== next?.tag)
    update({ target: next });
}
export function useLightTheme() {
  const store = (Stores as any).ThemeStore;
  return React.useSyncExternalStore(
    React.useCallback(
      (listener: () => void) => {
        store?.addChangeListener?.(listener);
        return () => store?.removeChangeListener?.(listener);
      },
      [store],
    ),
    () => store?.theme === "light",
    () => false,
  );
}
/** Native blur must sample a different branch of the view hierarchy. */
export function verifyBackdrop(
  dockTag: number,
  targetTag: number,
  callback: (safe: boolean) => void,
) {
  if (
    !Number.isFinite(dockTag) ||
    !Number.isFinite(targetTag) ||
    dockTag === targetTag
  ) {
    callback(false);
    return;
  }
  const manager = RN.UIManager as any;
  if (typeof manager.viewIsDescendantOf !== "function") {
    callback(false);
    return;
  }
  try {
    manager.viewIsDescendantOf(
      dockTag,
      targetTag,
      (answer: boolean | boolean[]) => {
        callback((Array.isArray(answer) ? answer[0] : answer) === false);
      },
    );
  } catch {
    callback(false);
  }
}
function eventTag(event: any): number | null {
  const tag = event.nativeEvent?.target ?? event.target;
  if (typeof tag === "number" && Number.isFinite(tag)) return tag;
  try {
    return RN.findNodeHandle(event.currentTarget ?? tag) ?? null;
  } catch {
    return null;
  }
}
class BlurBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* Retain the translucent finish if blur fails. */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function GlassSurface({ original }: { original: Element }) {
  const settings = useSettings();
  const state = useRuntime();
  const light = useLightTheme();
  const [tag, setTag] = React.useState<number | null>(null);
  const [verified, setVerified] = React.useState<string | null>(null);
  const finish =
    finishes[settings.finish as keyof typeof finishes] || finishes.balanced;
  const enabled = state.running && settings.enabled;
  const canTryBlur =
    enabled && settings.blur && !state.reduceTransparency && !!state.renderer;
  const targetKey =
    tag !== null && state.target
      ? `${generation}:${tag}:${state.target.tag}:${state.target.id}`
      : null;
  React.useEffect(() => {
    if (enabled) update({ attached: true });
  }, [enabled]);
  React.useEffect(() => {
    let active = true;
    const current = generation;
    setVerified(null);
    if (
      canTryBlur &&
      RN.Platform.OS === "android" &&
      tag !== null &&
      state.target &&
      targetKey
    ) {
      verifyBackdrop(tag, state.target.tag, (safe) => {
        if (active && safe && runtime.running && generation === current)
          setVerified(targetKey);
      });
    }
    return () => {
      active = false;
    };
  }, [canTryBlur, tag, state.target, targetKey]);
  if (!enabled) return original;
  const blur =
    canTryBlur &&
    (RN.Platform.OS === "ios" ||
      (targetKey !== null && verified === targetKey));
  const Renderer = state.renderer;
  const tint = light
    ? `rgba(245,248,255,${state.reduceTransparency ? 1 : finish.opacity})`
    : `rgba(26,29,39,${state.reduceTransparency ? 1 : finish.opacity})`;
  return (
    <RN.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      collapsable={false}
      onLayout={(event) => {
        const nativeTag = eventTag(event);
        if (nativeTag !== null) setTag(nativeTag);
      }}
      style={[
        RN.StyleSheet.absoluteFillObject,
        {
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: light
            ? "rgba(228,234,245,0.60)"
            : "rgba(27,30,39,0.64)",
        },
      ]}
    >
      {blur && Renderer ? (
        <BlurBoundary key={`${targetKey}:${light}`}>
          <Renderer
            pointerEvents="none"
            style={RN.StyleSheet.absoluteFillObject}
            blurTheme={light ? "light" : "dark"}
            blurAmount={finish.blur}
            tintColor={tint}
            android_blurTargetViewNativeId={state.target?.id}
            android_softwareBlurDisabled={true}
            android_fallbackColor={light ? "#E9EDF5" : "#252833"}
          />
        </BlurBoundary>
      ) : null}
      <RN.View
        style={[
          RN.StyleSheet.absoluteFillObject,
          {
            backgroundColor: tint,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: light
              ? "rgba(255,255,255,0.82)"
              : "rgba(255,255,255,0.20)",
          },
        ]}
      />
      {settings.highlights ? (
        <>
          <RN.View
            style={{
              position: "absolute",
              top: 1,
              left: "12%",
              right: "12%",
              height: 1,
              backgroundColor: "rgba(255,255,255,0.42)",
            }}
          />
          <RN.View
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              right: 2,
              height: "40%",
              borderTopLeftRadius: 999,
              borderTopRightRadius: 999,
              backgroundColor: light
                ? "rgba(255,255,255,0.13)"
                : "rgba(255,255,255,0.055)",
            }}
          />
        </>
      ) : null}
    </RN.View>
  );
}
function componentName(type: any): string {
  return (
    type?.displayName ||
    type?.name ||
    type?.type?.displayName ||
    type?.type?.name ||
    ""
  );
}
/** Walk rendered children only. Never invoke arbitrary components or inspect message content. */
export function decorateDockTree(tree: any): any {
  let remaining = 180;
  let inserted = false;
  const visit = (node: any, depth: number): any => {
    if (!node || depth > 14 || remaining-- <= 0) return node;
    if (Array.isArray(node)) {
      const next = node.map((value) => visit(value, depth + 1));
      return next.some((v, i) => v !== node[i]) ? next : node;
    }
    if (!React.isValidElement<any>(node)) return node;
    if (node.type === GlassSurface) {
      inserted = true;
      return node;
    }
    const props = node.props;
    if (
      !inserted &&
      props &&
      "barWidth" in props &&
      "hasNameplate" in props &&
      "isLargeAvatar" in props &&
      "avatarSize" in props
    ) {
      inserted = true;
      return <GlassSurface key={node.key} original={node} />;
    }
    // The exported themed component contains a non-exported YouBar function.
    // Its wrapper invokes that same function unconditionally, preserving its hooks.
    if (
      componentName(node.type) === "YouBar" &&
      typeof node.type === "function" &&
      !(node.type as any).prototype?.isReactComponent
    ) {
      const original = node.type as (props: any) => Element;
      let Wrapped = wrappers.get(original);
      if (!Wrapped) {
        Wrapped = function GlassYouBar(props: any) {
          const result = original(props);
          return <DockRoot original={result} />;
        };
        wrappers.set(original, Wrapped);
      }
      return { ...node, type: Wrapped };
    }
    if (props.children) {
      const children = visit(props.children, depth + 1);
      if (children !== props.children)
        return React.cloneElement(node, {}, children);
    }
    return node;
  };
  return visit(tree, 0);
}
export function DockRoot({ original }: { original: Element }) {
  const state = useRuntime();
  const settings = useSettings();
  return state.running && settings.enabled
    ? decorateDockTree(original)
    : original;
}
export function TargetView({ original }: { original: Element }) {
  const state = useRuntime();
  const owner = React.useRef({}).current;
  const ownId = React.useRef(`dariuss-lgd-content-${++targetSequence}`).current;
  const id =
    typeof original.props.nativeID === "string" && original.props.nativeID
      ? original.props.nativeID
      : ownId;
  React.useEffect(() => () => setTarget(owner, null), [owner]);
  if (!state.running) return original;
  return React.cloneElement(original, {
    nativeID: id,
    collapsable: false,
    onLayout: (event: any) => {
      const tag = eventTag(event);
      if (tag !== null) setTarget(owner, { id, tag });
      original.props.onLayout?.(event);
    },
  });
}
export function attachTargetTree(tree: any): any {
  let remaining = 100;
  let inserted = false;
  const visit = (node: any, depth: number): any => {
    if (!node || depth > 12 || remaining-- <= 0 || inserted) return node;
    if (Array.isArray(node)) {
      const next = node.map((v) => visit(v, depth + 1));
      return next.some((v, i) => v !== node[i]) ? next : node;
    }
    if (!React.isValidElement<any>(node)) return node;
    if (node.type === TargetView) {
      inserted = true;
      return node;
    }
    if (node.type === RN.View) {
      inserted = true;
      return <TargetView key={node.key} original={node} />;
    }
    if (node.props.children) {
      const children = visit(node.props.children, depth + 1);
      if (children !== node.props.children)
        return React.cloneElement(node, {}, children);
    }
    return node;
  };
  return visit(tree, 0);
}
const filter = createFilterGenerator<[string]>(
  ([name], _id, value: any) =>
    [
      value,
      value?.default,
      value?.default?.type,
      value?.type,
      value?.render,
      value?.default?.render,
    ].some((candidate) => componentName(candidate) === name),
  ([name]) => `dariuss.lgd.component(${name})`,
  FilterScopes.Initialized,
);
function observeComponent(
  name: string,
  transform: (result: any) => any,
  report: (error: unknown) => void,
) {
  const seen = new WeakSet<object>();
  const patches: (() => void)[] = [];
  let active = true;
  const remove = getModules(
    filter(name),
    (value: any) => {
      if (!active) return;
      let target = value,
        key = "default";
      if (typeof value.default?.type === "function") {
        target = value.default;
        key = "type";
      } else if (typeof value.default?.render === "function") {
        target = value.default;
        key = "render";
      } else if (typeof value.default !== "function") {
        if (typeof value.type === "function") key = "type";
        else if (typeof value.render === "function") key = "render";
        else return;
      }
      if (seen.has(target)) return;
      seen.add(target);
      let reported = false;
      patches.push(
        nativeInstead(
          target,
          key,
          function (args: any[], original: (...args: any[]) => any) {
            const result = Reflect.apply(original, this, args);
            if (!runtime.running) return result;
            try {
              return transform(result);
            } catch (error) {
              if (!reported) {
                reported = true;
                report(error);
              }
              return result;
            }
          },
        ),
      );
    },
    { returnNamespace: true },
  );
  return () => {
    active = false;
    remove();
    for (const unpatch of patches.reverse()) unpatch();
  };
}
export function startIntegration(report: (error: unknown) => void) {
  if (runtime.running) return;
  const current = ++generation;
  update({ running: true });
  cleanups.push(
    getModules(
      withProps("normalizeBlurTheme", "isBlurDisabled"),
      (value: any) => {
        if (runtime.running && generation === current && value.default)
          update({ renderer: value.default });
      },
    ),
  );
  for (const name of ["YouBar", "YouBarThemed"])
    cleanups.push(
      observeComponent(
        name,
        (original) => <DockRoot original={original} />,
        report,
      ),
    );
  cleanups.push(
    observeComponent("MainTabsNavigatorPanel", attachTargetTree, report),
  );
  const accessibility = RN.AccessibilityInfo as any;
  accessibility
    .isReduceTransparencyEnabled?.()
    .then((value: boolean) => {
      if (generation === current && runtime.running)
        update({ reduceTransparency: !!value });
    })
    .catch(() => {});
  const subscription = accessibility.addEventListener?.(
    "reduceTransparencyChanged",
    (value: boolean) => {
      if (generation === current && runtime.running)
        update({ reduceTransparency: !!value });
    },
  );
  if (subscription) cleanups.push(() => subscription.remove());
}
export function stopIntegration() {
  generation++;
  update({ running: false, target: null, renderer: null, attached: false });
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  targets.clear();
  wrappers = new WeakMap();
}
