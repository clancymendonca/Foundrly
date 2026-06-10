import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
import { MAX_UPLOAD_BYTES, uploadImage } from "@/lib/upload-image";

export type ImageInputType = "url" | "upload";

const IMAGE_SEGMENTS = [
  { value: "upload" as const, label: "Upload" },
  { value: "url" as const, label: "URL" },
];

interface StartupImageInputProps {
  imageInputType: ImageInputType;
  onImageInputTypeChange: (type: ImageInputType) => void;
  link: string;
  onLinkChange: (link: string) => void;
  uploadedImageUrl: string;
  onUploadedImageUrlChange: (url: string) => void;
  onHasUploadedImageChange: (value: boolean) => void;
  onUploadingChange: (uploading: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function StartupImageInput({
  imageInputType,
  onImageInputTypeChange,
  link,
  onLinkChange,
  uploadedImageUrl,
  onUploadedImageUrlChange,
  onHasUploadedImageChange,
  onUploadingChange,
  error,
  disabled = false,
}: StartupImageInputProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const setUploading = (value: boolean) => {
    setIsUploading(value);
    onUploadingChange(value);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission required",
        text2: "Allow photo library access to upload an image.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
      Toast.show({
        type: "error",
        text1: "Image too large",
        text2: "File size must be less than 5MB.",
      });
      return;
    }

    setLocalPreview(asset.uri);
    setUploading(true);
    onLinkChange("");
    onUploadedImageUrlChange("");

    const mimeType = asset.mimeType || "image/jpeg";
    const fileName = asset.fileName || "startup-image.jpg";
    const uploadResult = await uploadImage(asset.uri, mimeType, fileName);

    setUploading(false);

    if (!uploadResult.success || !uploadResult.url) {
      Toast.show({
        type: "error",
        text1: uploadResult.error || "Failed to upload image",
      });
      setLocalPreview(null);
      onHasUploadedImageChange(false);
      return;
    }

    onUploadedImageUrlChange(uploadResult.url);
    onLinkChange(uploadResult.url);
    onHasUploadedImageChange(true);
    Toast.show({ type: "success", text1: "Image uploaded successfully" });
  };

  const handleRemoveImage = () => {
    setLocalPreview(null);
    onUploadedImageUrlChange("");
    onLinkChange("");
    onHasUploadedImageChange(false);
  };

  const previewUri = localPreview || uploadedImageUrl || link;

  return (
    <View>
      <SegmentedControl
        options={IMAGE_SEGMENTS}
        value={imageInputType}
        onChange={onImageInputTypeChange}
        disabled={disabled || isUploading}
      />

      {imageInputType === "url" ? (
        <TextInput
          style={formStyles.input}
          value={link}
          onChangeText={(text) => {
            onLinkChange(text);
            onHasUploadedImageChange(false);
            onUploadedImageUrlChange("");
          }}
          editable={!disabled && !isUploading}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor={theme.gray500}
          autoCapitalize="none"
          keyboardType="url"
        />
      ) : (
        <View>
          {previewUri ? (
            <View style={formStyles.imagePreviewWrap}>
              <Image
                source={{ uri: previewUri }}
                style={formStyles.imagePreview}
                contentFit="cover"
              />
              <Pressable
                onPress={handleRemoveImage}
                disabled={disabled || isUploading}
                style={formStyles.imageRemoveBtn}
              >
                <Text style={formStyles.imageRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={handlePickImage}
            disabled={disabled || isUploading}
            style={[formStyles.photoCard, isUploading && { opacity: 0.6 }]}
          >
            {isUploading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={theme.primary} />
                <Text style={formStyles.photoCardText}>
                  {previewUri ? "Change cover photo" : "Add cover photo"}
                </Text>
                <Text style={formStyles.photoCardHint}>
                  JPG or PNG, max 5MB
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
