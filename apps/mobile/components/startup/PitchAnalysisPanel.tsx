import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPitchScoreTheme, type PitchAnalysis } from "@foundrly/shared";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export type { PitchAnalysis };

interface PitchAnalysisPanelProps {
  analysis: PitchAnalysis;
  isStale?: boolean;
  currentCategory?: string;
  onApplyCategory?: (category: string) => void;
}

function BulletList({
  title,
  items,
  titleColor,
  icon,
}: {
  title: string;
  items: string[];
  titleColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <Ionicons name={icon} size={16} color={titleColor} />
        <Text style={[styles.blockTitle, { color: titleColor }]}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <Text key={index} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function PitchAnalysisPanel({
  analysis,
  isStale = false,
  currentCategory = "",
  onApplyCategory,
}: PitchAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const insights = analysis.marketInsights;
  const scoreTheme = getPitchScoreTheme(analysis.overallScore);
  const showApplyCategory =
    Boolean(onApplyCategory) &&
    Boolean(analysis.category?.trim()) &&
    analysis.category.trim().toLowerCase() !== currentCategory.trim().toLowerCase();

  const hasMarketInsights = Boolean(
    insights?.marketSize || insights?.competition || insights?.trends,
  );

  useEffect(() => {
    setExpanded(true);
  }, [analysis.overallScore, analysis.strengths?.length]);

  return (
    <View style={formStyles.analysisCard}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={theme.primary} />
          <Text style={styles.title}>AI feedback</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreTheme.badgeBg }]}>
            <Text style={[styles.scoreText, { color: scoreTheme.textColor }]}>
              {analysis.overallScore} / 10
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.gray600}
          />
        </View>
      </Pressable>

      <Text style={[styles.scoreLabel, { color: scoreTheme.textColor }]}>
        {scoreTheme.label}
      </Text>

      {isStale ? (
        <View style={styles.staleBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#CA8A04" />
          <Text style={styles.staleText}>
            Pitch changed since this analysis. Re-analyze for updated feedback.
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.stack}>
          <BulletList
            title="Strengths"
            items={analysis.strengths ?? []}
            titleColor={theme.green600}
            icon="checkmark-circle-outline"
          />
          <BulletList
            title="Areas for improvement"
            items={analysis.weaknesses ?? []}
            titleColor={theme.red600}
            icon="alert-circle-outline"
          />
          <BulletList
            title="AI suggestions"
            items={analysis.suggestions ?? []}
            titleColor={theme.blue500}
            icon="bulb-outline"
          />
          <BulletList
            title="Missing elements"
            items={analysis.missingElements ?? []}
            titleColor="#EA580C"
            icon="list-outline"
          />

          {hasMarketInsights ? (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Ionicons name="trending-up-outline" size={16} color={theme.purple500} />
                <Text style={[styles.blockTitle, { color: theme.purple500 }]}>
                  Market insights
                </Text>
              </View>
              {insights?.marketSize ? (
                <Text style={styles.listItem}>Market size: {insights.marketSize}</Text>
              ) : null}
              {insights?.competition ? (
                <Text style={styles.listItem}>
                  Competition: {insights.competition}
                </Text>
              ) : null}
              {insights?.trends ? (
                <Text style={styles.listItem}>Trends: {insights.trends}</Text>
              ) : null}
            </View>
          ) : null}

          {analysis.category?.trim() ? (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Ionicons name="pricetag-outline" size={16} color={theme.gray700} />
                <Text style={styles.blockTitle}>Suggested category</Text>
              </View>
              <Text style={styles.metaValue}>{analysis.category}</Text>
              {showApplyCategory ? (
                <Pressable
                  onPress={() => onApplyCategory?.(analysis.category)}
                  style={styles.applyBtn}
                >
                  <Text style={styles.applyBtnText}>Use category</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {analysis.tags && analysis.tags.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Ionicons name="bookmark-outline" size={16} color={theme.gray700} />
                <Text style={styles.blockTitle}>Suggested tags</Text>
              </View>
              <View style={styles.tagRow}>
                {analysis.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.black,
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 12,
  },
  scoreLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  staleBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF9C3",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  staleText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#854D0E",
  },
  stack: {
    gap: 10,
    marginTop: 4,
  },
  block: {
    backgroundColor: theme.gray100,
    borderRadius: 10,
    padding: 12,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  blockTitle: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 14,
    color: theme.black,
  },
  listItem: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.gray700,
    marginBottom: 4,
    lineHeight: 18,
  },
  metaValue: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 13,
    color: theme.gray700,
  },
  applyBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  applyBtnText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 12,
    color: theme.primary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    color: theme.blue500,
  },
});
