import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  counter?: string;
  error?: string;
  multiline?: boolean;
}

export function FormField({
  label,
  hint,
  counter,
  error,
  multiline = false,
  editable = true,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={formStyles.field}>
      <View style={styles.labelRow}>
        <Text style={formStyles.label}>{label}</Text>
        {counter ? <Text style={formStyles.counter}>{counter}</Text> : null}
      </View>
      <TextInput
        style={[
          multiline ? formStyles.textarea : formStyles.input,
          !editable && formStyles.inputDisabled,
          style,
        ]}
        editable={editable}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor={theme.gray500}
        {...inputProps}
      />
      {hint && !error ? (
        <Text style={formStyles.helperText}>{hint}</Text>
      ) : null}
      {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
});
