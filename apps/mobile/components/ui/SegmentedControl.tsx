import { Pressable, StyleSheet, Text, View } from "react-native";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <View style={formStyles.segmentTrack}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={[
              formStyles.segmentItem,
              active && formStyles.segmentItemActive,
            ]}
          >
            <Text
              style={[
                formStyles.segmentItemText,
                active && formStyles.segmentItemTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
