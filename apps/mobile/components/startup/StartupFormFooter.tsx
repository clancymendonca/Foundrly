import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

interface StartupFormFooterProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Extra bottom offset when tab bar is visible (create tab). */
  tabBarOffset?: number;
}

export function StartupFormFooter({
  label,
  onPress,
  disabled = false,
  loading = false,
  tabBarOffset = 0,
}: StartupFormFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) + tabBarOffset },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          formStyles.submitBtn,
          (disabled || loading) && formStyles.submitBtnDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.white} />
        ) : (
          <Text style={formStyles.submitBtnText}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

export const STARTUP_FORM_FOOTER_HEIGHT = 72;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: theme.white,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
    shadowColor: theme.shadow100,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
});
