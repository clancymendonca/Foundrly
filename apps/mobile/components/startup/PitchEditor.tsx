import { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputSelectionChangeEvent,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { pitchMarkdownStyles } from "@/lib/markdown-styles";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
import { MarkdownToolbar, type MarkdownInsert } from "./MarkdownToolbar";

type PitchTab = "write" | "preview";

const PITCH_SEGMENTS = [
  { value: "write" as const, label: "Write" },
  { value: "preview" as const, label: "Preview" },
];

const EDITOR_MIN_HEIGHT = 260;

interface PitchEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function applyMarkdownInsert(
  value: string,
  selection: { start: number; end: number },
  insert: MarkdownInsert,
): { nextValue: string; nextSelection: { start: number; end: number } } {
  const { start, end } = selection;
  const selected = value.slice(start, end);

  if (insert.kind === "wrap") {
    const inner = selected || insert.placeholder || "";
    const nextValue =
      value.slice(0, start) +
      insert.before +
      inner +
      insert.after +
      value.slice(end);
    const cursorStart = start + insert.before.length;
    const cursorEnd = cursorStart + inner.length;
    return { nextValue, nextSelection: { start: cursorStart, end: cursorEnd } };
  }

  const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
  const prefix = (needsLeadingNewline ? "\n" : "") + insert.prefix;
  const inner = selected || insert.placeholder || "";
  const nextValue = value.slice(0, start) + prefix + inner + value.slice(end);
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + inner.length;
  return { nextValue, nextSelection: { start: cursorStart, end: cursorEnd } };
}

export function PitchEditor({
  value,
  onChange,
  error,
  disabled = false,
}: PitchEditorProps) {
  const [tab, setTab] = useState<PitchTab>("write");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const handleSelectionChange = useCallback(
    (event: TextInputSelectionChangeEvent) => {
      setSelection(event.nativeEvent.selection);
    },
    [],
  );

  const handleToolbarAction = useCallback(
    (insert: MarkdownInsert) => {
      if (disabled) return;
      inputRef.current?.focus();
      const { nextValue, nextSelection } = applyMarkdownInsert(
        value,
        selection,
        insert,
      );
      onChange(nextValue);
      setSelection(nextSelection);
      requestAnimationFrame(() => {
        inputRef.current?.setNativeProps({ selection: nextSelection });
      });
    },
    [disabled, onChange, selection, value],
  );

  const wordCount = countWords(value);
  const charCount = value.length;

  return (
    <View>
      <SegmentedControl
        options={PITCH_SEGMENTS}
        value={tab}
        onChange={setTab}
        disabled={disabled}
      />

      <View style={styles.shell}>
        {tab === "write" ? (
          <>
            <MarkdownToolbar onAction={handleToolbarAction} disabled={disabled} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={onChange}
              onSelectionChange={handleSelectionChange}
              multiline
              scrollEnabled
              editable={!disabled}
              placeholder={
                "Tell your story in markdown.\n\n## Problem\nWhat pain point are you solving?\n\n## Solution\nHow does your product help?"
              }
              placeholderTextColor={theme.gray500}
              textAlignVertical="top"
              autoCorrect
              autoCapitalize="sentences"
            />
          </>
        ) : (
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {value.trim() ? (
              <Markdown style={pitchMarkdownStyles}>{value}</Markdown>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyTitle}>Nothing to preview yet</Text>
                <Text style={styles.emptyHint}>
                  Switch to Write and use headings, lists, and bold text. Your
                  formatted pitch will appear here.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerHint}>Markdown supported</Text>
          <Text style={styles.footerCount}>
            {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount}{" "}
            {charCount === 1 ? "character" : "characters"}
          </Text>
        </View>
      </View>

      {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    backgroundColor: theme.gray100,
    overflow: "hidden",
  },
  input: {
    minHeight: EDITOR_MIN_HEIGHT,
    maxHeight: 360,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: theme.black,
    backgroundColor: theme.white,
  },
  previewScroll: {
    minHeight: EDITOR_MIN_HEIGHT,
    maxHeight: 360,
    backgroundColor: theme.white,
  },
  previewContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexGrow: 1,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 15,
    color: theme.gray700,
  },
  emptyHint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.gray500,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
    backgroundColor: theme.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  footerHint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.gray500,
  },
  footerCount: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.gray500,
  },
});
