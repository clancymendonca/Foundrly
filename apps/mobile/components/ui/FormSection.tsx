import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NeoCard } from "@/components/ui/NeoCard";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <NeoCard style={styles.wrap} contentStyle={styles.cardInner}>
      <View style={styles.header}>
        <Text style={formStyles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={formStyles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 0,
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
    paddingBottom: 10,
  },
});
