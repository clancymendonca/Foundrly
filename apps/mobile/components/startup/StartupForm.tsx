import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  startupFormSchemaWithImage,
  type Startup,
  type StartupFormValues,
} from "@foundrly/shared";
import { AccountRestrictedBanner } from "./AccountRestrictedBanner";
import { PitchAnalysisPanel } from "./PitchAnalysisPanel";
import { PitchEditor } from "./PitchEditor";
import {
  StartupFormFooter,
  STARTUP_FORM_FOOTER_HEIGHT,
} from "./StartupFormFooter";
import {
  StartupImageInput,
  type ImageInputType,
} from "./StartupImageInput";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
import { useBanCheck } from "@/hooks/use-ban-check";
import { usePitchAi } from "@/hooks/use-pitch-ai";

interface StartupFormProps {
  mode: "create" | "edit";
  startupId?: string;
  initialValues?: Partial<StartupFormValues>;
  showIntro?: boolean;
  header?: ReactNode;
}

export function StartupForm({
  mode,
  startupId,
  initialValues,
  showIntro = false,
  header,
}: StartupFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { banStatus, isLoading: banLoading } = useBanCheck(user?.id);

  const [imageInputType, setImageInputType] = useState<ImageInputType>("upload");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StartupFormValues>({
    resolver: zodResolver(startupFormSchemaWithImage),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      link: "",
      pitch: "",
      buyMeACoffeeUsername: "",
      hasUploadedImage: false,
    },
  });

  useEffect(() => {
    if (!initialValues) return;
    reset({
      title: initialValues.title ?? "",
      description: initialValues.description ?? "",
      category: initialValues.category ?? "",
      link: initialValues.link ?? "",
      pitch: initialValues.pitch ?? "",
      buyMeACoffeeUsername: initialValues.buyMeACoffeeUsername ?? "",
      hasUploadedImage: Boolean(initialValues.link?.trim()),
    });
    if (initialValues.link?.trim()) {
      setUploadedImageUrl(initialValues.link);
      setImageInputType("upload");
    }
  }, [initialValues, reset]);

  const title = watch("title");
  const description = watch("description");
  const category = watch("category");
  const pitch = watch("pitch");

  const scrollToAnalysis = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const {
    aiLoading,
    isAnalyzing,
    aiError,
    analysisError,
    pitchAnalysis,
    isAnalysisStale,
    canGenerate,
    canAnalyze,
    handleGeneratePitch,
    handleAnalyzePitch,
  } = usePitchAi({
    title,
    description,
    category,
    pitch,
    onPitchChange: (value) => setValue("pitch", value, { shouldValidate: true }),
    onAnalysisComplete: scrollToAnalysis,
  });

  const mutation = useMutation({
    mutationFn: (values: StartupFormValues) => {
      const finalLink = uploadedImageUrl || values.link;
      const body = {
        title: values.title,
        description: values.description,
        category: values.category,
        link: finalLink,
        pitch: values.pitch,
        buyMeACoffeeUsername: values.buyMeACoffeeUsername || undefined,
      };

      if (mode === "edit" && startupId) {
        return apiFetch<Startup>(`/api/startups/${startupId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }

      return apiFetch<Startup>("/api/startups", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1:
          mode === "edit"
            ? "Startup updated!"
            : "Your startup pitch has been created successfully",
      });
      router.push(`/startup/${data._id}` as any);
    },
    onError: (e: Error) => {
      Toast.show({ type: "error", text1: e.message });
    },
  });

  const onInvalid = (fieldErrors: typeof errors) => {
    const messages = Object.values(fieldErrors)
      .map((err) => err?.message)
      .filter(Boolean)
      .join("\n");
    if (messages) {
      Toast.show({ type: "error", text1: "Notice", text2: messages });
    }
  };

  const formDisabled = banLoading || banStatus.isBanned || mutation.isPending;
  const footerDisabled = formDisabled || isUploading;

  const submitLabel = mutation.isPending
    ? mode === "edit"
      ? "Saving..."
      : "Submitting..."
    : isUploading
      ? "Uploading..."
      : banLoading
        ? "Checking..."
        : mode === "edit"
          ? "Save Changes"
          : "Submit Your Pitch";

  if (banStatus.isBanned) {
    return (
      <AccountRestrictedBanner
        message={banStatus.message}
        isPermanent={banStatus.isPermanent}
      />
    );
  }

  const scrollBottomPad = STARTUP_FORM_FOOTER_HEIGHT + 24;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: scrollBottomPad }}
          showsVerticalScrollIndicator={false}
        >
          {header}
          {showIntro ? (
            <View style={formStyles.pageIntro}>
              <Text style={formStyles.pageTitle}>New pitch</Text>
              <Text style={formStyles.pageSubtitle}>
                Share your startup idea with the community. Fill in the details
                below and submit when you are ready.
              </Text>
            </View>
          ) : null}

          <View style={formStyles.form}>
            <FormSection
              title="Basics"
              subtitle="Tell people what your startup is about"
            >
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Title"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!formDisabled}
                    placeholder="Startup title"
                    error={errors.title?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Description"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!formDisabled}
                    multiline
                    placeholder="Short summary of your startup"
                    counter={`${value.length}/500`}
                    error={errors.description?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Category"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!formDisabled}
                    placeholder="Tech, Health, Education..."
                    error={errors.category?.message}
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Support"
              subtitle="Optional — link your Buy Me a Coffee"
            >
              <Controller
                control={control}
                name="buyMeACoffeeUsername"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Buy Me a Coffee username"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!formDisabled}
                    placeholder="your-username"
                    autoCapitalize="none"
                    hint="If you have a Buy Me a Coffee account, enter your username to receive support."
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Cover image"
              subtitle="Upload a photo or paste an image URL"
            >
              <Controller
                control={control}
                name="link"
                render={({ field: { onChange, value } }) => (
                  <StartupImageInput
                    imageInputType={imageInputType}
                    onImageInputTypeChange={setImageInputType}
                    link={value ?? ""}
                    onLinkChange={onChange}
                    uploadedImageUrl={uploadedImageUrl}
                    onUploadedImageUrlChange={setUploadedImageUrl}
                    onHasUploadedImageChange={(hasImage) =>
                      setValue("hasUploadedImage", hasImage, {
                        shouldValidate: true,
                      })
                    }
                    onUploadingChange={setIsUploading}
                    error={errors.link?.message}
                    disabled={formDisabled}
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Pitch"
              subtitle="Write your full pitch in markdown"
            >
              <Pressable
                onPress={handleGeneratePitch}
                disabled={formDisabled || aiLoading || !canGenerate}
                style={[
                  formStyles.outlineBtn,
                  (aiLoading || !canGenerate) && { opacity: 0.6 },
                  { marginBottom: 8 },
                ]}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
                )}
                <Text style={formStyles.outlineBtnText}>
                  {aiLoading ? "Generating..." : "Generate pitch"}
                </Text>
              </Pressable>

              {!canGenerate ? (
                <Text style={[formStyles.helperText, { marginBottom: 12 }]}>
                  Fill in title and description first.
                </Text>
              ) : null}

              {aiError ? (
                <Text style={[formStyles.errorText, { marginBottom: 12 }]}>
                  {aiError}
                </Text>
              ) : null}

              <Controller
                control={control}
                name="pitch"
                render={({ field: { onChange, value } }) => (
                  <PitchEditor
                    value={value}
                    onChange={onChange}
                    error={errors.pitch?.message}
                    disabled={formDisabled}
                  />
                )}
              />

              <Pressable
                onPress={handleAnalyzePitch}
                disabled={formDisabled || isAnalyzing || !canAnalyze}
                style={[
                  formStyles.outlineBtn,
                  (isAnalyzing || !canAnalyze) && { opacity: 0.6 },
                  { marginTop: 12 },
                ]}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons
                    name="analytics-outline"
                    size={18}
                    color={theme.primary}
                  />
                )}
                <Text style={formStyles.outlineBtnText}>
                  {isAnalyzing ? "Analyzing..." : "Analyze pitch"}
                </Text>
              </Pressable>

              {analysisError ? (
                <Text style={[formStyles.errorText, { marginTop: 8 }]}>
                  {analysisError}
                </Text>
              ) : null}

              {pitchAnalysis ? (
                <View style={{ marginTop: 12 }}>
                  <PitchAnalysisPanel
                    analysis={pitchAnalysis}
                    isStale={isAnalysisStale}
                    currentCategory={category}
                    onApplyCategory={(nextCategory) =>
                      setValue("category", nextCategory, { shouldValidate: true })
                    }
                  />
                </View>
              ) : null}
            </FormSection>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StartupFormFooter
        label={submitLabel}
        onPress={handleSubmit(
          (values) => mutation.mutate(values),
          onInvalid,
        )}
        disabled={footerDisabled}
        loading={mutation.isPending || banLoading}
      />
    </View>
  );
}
