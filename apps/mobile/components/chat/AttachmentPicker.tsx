import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PickedAttachment } from "@/lib/chat-attachments";
import { theme } from "@/lib/theme";

export function AttachmentPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (attachment: PickedAttachment) => void;
}) {
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onClose();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({
        kind: "image",
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        mimeType: asset.mimeType || "image/jpeg",
      });
    }
    onClose();
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({
        kind: "file",
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>Send attachment</Text>
          <Pressable style={styles.option} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={theme.primary} />
            <Text style={styles.optionText}>Photo</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={pickFile}>
            <Ionicons name="document-outline" size={24} color={theme.primary} />
            <Text style={styles.optionText}>File</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 5,
    borderColor: theme.black,
    padding: 20,
    gap: 8,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.black,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  optionText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 16,
    color: theme.black,
  },
});
