import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api-client";
import { theme } from "@/lib/theme";

export function InterestedModal({
  visible,
  onClose,
  startupId,
  startupTitle,
  userId,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  startupId: string;
  startupTitle: string;
  userId?: string;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    if (!consent) {
      setError("You must consent to be contacted.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/interested?id=${startupId}`, { method: "POST" });
      await apiFetch("/api/interested-form", {
        method: "POST",
        body: JSON.stringify({
          startupId,
          startupTitle,
          userId,
          name,
          email,
          message,
          consentToContact: consent,
          preferredContact: "email",
        }),
      });
      onSuccess?.();
      onClose();
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Show Interest</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.black} />
            </Pressable>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {startupTitle}
          </Text>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
            <Pressable
              style={styles.consentRow}
              onPress={() => setConsent((c) => !c)}
            >
              <Ionicons
                name={consent ? "checkbox" : "square-outline"}
                size={22}
                color={theme.primary}
              />
              <Text style={styles.consentText}>I consent to be contacted</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            style={styles.submit}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <>
                <Ionicons name="heart" size={18} color={theme.white} />
                <Text style={styles.submitText}>Submit Interest</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "85%",
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 5,
    borderColor: theme.black,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.black,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray600,
    marginTop: 4,
    marginBottom: 16,
  },
  form: { maxHeight: 360 },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    marginBottom: 4,
    color: theme.black,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  consentText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.black100,
    flex: 1,
  },
  error: {
    color: theme.red600,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.purple500,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.white,
  },
});
