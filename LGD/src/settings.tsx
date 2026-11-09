import * as React from "react";
import * as RN from "react-native";
import { getAssetIdByName } from "@valenced/assets";
import {
  finishes,
  useLightTheme,
  useRuntime,
  useSettings,
} from "./integration";
function Icon({ name, color }: { name: string; color: string }) {
  let source: number | undefined;
  try {
    source = getAssetIdByName(name);
  } catch {}
  return source ? (
    <RN.Image
      source={source}
      resizeMode="contain"
      style={{ width: 24, height: 24, tintColor: color }}
    />
  ) : (
    <RN.Text style={{ color, fontSize: 18 }}>●</RN.Text>
  );
}
export default function Settings() {
  const settings = useSettings();
  const runtime = useRuntime();
  const light = useLightTheme();
  const text = light ? "#15171C" : "#FFFFFF";
  const sub = light ? "#5C5E66" : "#B5BAC1";
  const card = light ? "#F2F3F5" : "#2B2D31";
  const background = light ? "#FFFFFF" : "#1E1F22";
  const divider = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const set = (key: string, value: unknown) =>
    useSettings.getState().updateSettings({ [key]: value });
  const row = (
    key: string,
    title: string,
    detail: string,
    icon: string,
    last = false,
  ) => (
    <RN.View
      key={key}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
        borderBottomWidth: last ? 0 : RN.StyleSheet.hairlineWidth,
        borderBottomColor: divider,
      }}
    >
      <RN.View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#5865F2",
        }}
      >
        <Icon name={icon} color="#FFFFFF" />
      </RN.View>
      <RN.View style={{ flex: 1 }}>
        <RN.Text style={{ color: text, fontSize: 16, fontWeight: "600" }}>
          {title}
        </RN.Text>
        <RN.Text
          style={{ color: sub, fontSize: 13, marginTop: 4, lineHeight: 18 }}
        >
          {detail}
        </RN.Text>
      </RN.View>
      <RN.Switch
        value={!!settings[key]}
        onValueChange={(value) => set(key, value)}
        trackColor={{ true: "#5865F2", false: "#4E5058" }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </RN.View>
  );
  const finish =
    finishes[settings.finish as keyof typeof finishes] || finishes.balanced;
  return (
    <RN.ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
    >
      <RN.Text style={{ color: text, fontSize: 24, fontWeight: "800" }}>
        Liquid Glass YOUBAR
      </RN.Text>
      <RN.Text
        style={{ color: sub, fontSize: 14, marginTop: 6, marginBottom: 22 }}
      >
        A subtle glass finish for your Discord dock.
      </RN.Text>
      <RN.View
        style={{
          borderRadius: 22,
          padding: 20,
          marginBottom: 24,
          backgroundColor: light ? "#DDE5F5" : "#171F34",
        }}
      >
        <RN.View
          style={{
            borderRadius: 32,
            minHeight: 60,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.40)",
            backgroundColor: light
              ? `rgba(255,255,255,${finish.opacity})`
              : `rgba(125,145,185,${finish.opacity})`,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            overflow: "hidden",
          }}
        >
          {settings.highlights ? (
            <RN.View
              style={{
                position: "absolute",
                left: "15%",
                right: "15%",
                top: 1,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.55)",
              }}
            />
          ) : null}
          <Icon name="HomeIcon" color={text} />
          <Icon name="BellIcon" color={text} />
          <Icon name="UserIcon" color={text} />
        </RN.View>
        <RN.Text
          style={{
            textAlign: "center",
            color: sub,
            fontSize: 12,
            marginTop: 12,
          }}
        >
          Appearance preview
        </RN.Text>
      </RN.View>
      <RN.Text
        style={{
          color: text,
          fontSize: 15,
          fontWeight: "700",
          marginHorizontal: 6,
          marginBottom: 10,
        }}
      >
        Appearance
      </RN.Text>
      <RN.View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: card,
          marginBottom: 24,
        }}
      >
        {row(
          "enabled",
          "Enable glass dock",
          "Keep Discord's buttons, badges and navigation.",
          "SparklesIcon",
        )}
        {row(
          "blur",
          "Backdrop blur",
          "Use native blur when a supported backdrop is available.",
          "PaintPaletteIcon",
        )}
        {row(
          "highlights",
          "Glass highlights",
          "Add a soft reflection and a fine edge.",
          "SunIcon",
          true,
        )}
      </RN.View>
      <RN.Text
        style={{
          color: text,
          fontSize: 15,
          fontWeight: "700",
          marginHorizontal: 6,
          marginBottom: 10,
        }}
      >
        Glass finish
      </RN.Text>
      <RN.View
        style={{
          borderRadius: 20,
          backgroundColor: card,
          padding: 12,
          marginBottom: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        {Object.entries(finishes).map(([key, value]) => (
          <RN.Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected: settings.finish === key }}
            onPress={() => set("finish", key)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: settings.finish === key ? "#5865F2" : divider,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <RN.Text
              style={{
                color: settings.finish === key ? "#FFFFFF" : text,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {value.label}
            </RN.Text>
          </RN.Pressable>
        ))}
      </RN.View>
      <RN.Text
        style={{
          color: sub,
          fontSize: 12,
          lineHeight: 18,
          marginHorizontal: 6,
        }}
      >
        {runtime.reduceTransparency
          ? "Reduce Transparency is enabled. A solid finish is used."
          : "Unsupported blur falls back to a translucent finish. Subtle uses the lightest effect; Frosted adds more tint and blur."}
      </RN.Text>
      {!runtime.attached ? (
        <RN.Text
          style={{
            color: sub,
            fontSize: 12,
            lineHeight: 18,
            margin: 6,
            marginTop: 12,
          }}
        >
          Return to the main screen after enabling the plugin. Restart Discord
          if the dock has not changed.
        </RN.Text>
      ) : null}
      <RN.Text
        style={{ color: sub, fontSize: 12, textAlign: "center", marginTop: 26 }}
      >
        Liquid Glass YOUBAR · 1.0.0-beta
      </RN.Text>
    </RN.ScrollView>
  );
}
