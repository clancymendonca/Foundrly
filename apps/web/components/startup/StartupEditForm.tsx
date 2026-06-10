"use client";

import React, { useState, useActionState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Send, Upload, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileInput } from "@/components/ui/file-input";
import { formSchema } from "@/lib/validation";
import { updatePitch } from "@/lib/actions";
import { uploadImage } from "@/lib/upload";
import { BanCheckWrapper } from "@/components/moderation/BanCheckWrapper";
import { StartupTypeCard } from "./StartupCard";
import { extractGeneratedPitch, type PitchAnalysis } from "@foundrly/shared";

interface StartupEditFormProps {
  startup: StartupTypeCard;
}

const StartupEditFormContent = ({ 
  startup, 
  isBanned, 
  banMessage, 
  banLoading 
}: StartupEditFormProps & { 
  isBanned: boolean; 
  banMessage: string; 
  banLoading: boolean; 
}) => {
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(startup.title || "");
  const [description, setDescription] = useState(startup.description || "");
  const [category, setCategory] = useState(startup.category || "");
  const [pitch, setPitch] = useState(startup.pitch || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageInputType, setImageInputType] = useState<"url" | "upload">("url");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    setUploadedImageUrl("");
    
    if (file) {
      setIsUploading(true);
      try {
        const result = await uploadImage(file);
        if (result.success && result.url) {
          setUploadedImageUrl(result.url);
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to upload image",
            variant: "destructive",
          });
          setSelectedFile(null);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFormSubmit = async (prevState: any, formData: FormData) => {
    try {
      const formValues = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        link: imageInputType === "url" ? (formData.get("link") as string) : "",
        pitch,
        imageFile: selectedFile,
        buyMeACoffeeUsername: formData.get("buyMeACoffeeUsername") as string,
      };

      await formSchema.parseAsync(formValues);

      // Use uploaded image URL if available, otherwise use the link
      const finalImageUrl = uploadedImageUrl || formValues.link;
      
      // Create a new FormData with the final image URL
      const finalFormData = new FormData();
      finalFormData.append("title", formValues.title);
      finalFormData.append("description", formValues.description);
      finalFormData.append("category", formValues.category);
      finalFormData.append("link", finalImageUrl);
      finalFormData.append("pitch", pitch);
      finalFormData.append("buyMeACoffeeUsername", formValues.buyMeACoffeeUsername || "");

      const result = await updatePitch(prevState, finalFormData, pitch, startup._id);

      if (result.status == "SUCCESS") {
        toast({
          title: "Success",
          description: "Your startup pitch has been updated successfully",
        });

        router.push(`/startup/${startup._id}`);
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Error",
          description: "Failed to update startup pitch",
          variant: "destructive",
        });
      }
      return { status: "ERROR", message: "Validation failed" };
    }
  };

  const [isPending, formAction] = useActionState(handleFormSubmit, null);

  // Show ban message if user is banned
  if (isBanned) {
    return (
      <div className="startup-form">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800">Account Restricted</h3>
            <p className="text-red-600 text-sm">{banMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="startup-form">
      <div>
        <label htmlFor="title" className="startup-form_label">Title</label>
        <Input
          id="title"
          name="title"
          className="startup-form_input"
          required
          placeholder="Startup Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={banLoading}
        />
        {errors.title && <p className="startup-form_error">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="startup-form_label">Description</label>
        <Textarea
          id="description"
          name="description"
          className="startup-form_textarea"
          required
          placeholder="Startup Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={banLoading}
        />
        {errors.description && <p className="startup-form_error">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="category" className="startup-form_label">Category</label>
        <Input
          id="category"
          name="category"
          className="startup-form_input"
          required
          placeholder="Startup Category (Tech, Health, Education...)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          disabled={banLoading}
        />
        {errors.category && <p className="startup-form_error">{errors.category}</p>}
      </div>

      <div>
        <label htmlFor="buyMeACoffeeUsername" className="startup-form_label">Buy me a coffee username (optional)</label>
        <Input
          id="buyMeACoffeeUsername"
          name="buyMeACoffeeUsername"
          className="startup-form_input"
          placeholder="Your Buy me a coffee username"
          value={startup.buyMeACoffeeUsername || ""}
          disabled={banLoading}
        />
        <p className="text-sm text-gray-500 mt-1">If you have a Buy me a coffee account, enter your username to receive support</p>
        {errors.buyMeACoffeeUsername && <p className="startup-form_error">{errors.buyMeACoffeeUsername}</p>}
      </div>

      <div>
        <label className="startup-form_label">Startup Image</label>
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={imageInputType === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setImageInputType("url")}
            className="flex items-center gap-2"
            disabled={banLoading}
          >
            <LinkIcon className="h-4 w-4" />
            Image URL
          </Button>
          <Button
            type="button"
            variant={imageInputType === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setImageInputType("upload")}
            className="flex items-center gap-2"
            disabled={banLoading}
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        </div>
        {imageInputType === "url" ? (
          <Input
            id="link"
            name="link"
            className="startup-form_input"
            placeholder="Startup Image URL"
            value={startup.image}
            disabled={banLoading}
          />
        ) : (
          <FileInput
            onFileSelect={handleFileSelect}
            disabled={isUploading || banLoading}
            maxSize={5}
          />
        )}
        {errors.link && <p className="startup-form_error">{errors.link}</p>}
      </div>

      <div data-color-mode="light">
        {aiError && <p className="startup-form_error">{aiError}</p>}
        {analysisError && <p className="startup-form_error">{analysisError}</p>}
        <label htmlFor="pitch" className="startup-form_label">Pitch</label>
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={async () => {
                setAiLoading(true);
                setAiError(null);
                try {
                  if (!title || !description) {
                    toast({ title: "Notice", description: "Please fill in both title and description fields." });
                    setAiLoading(false);
                    return;
                  }
                  const response = await fetch("/api/ai/generate-content", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, description, category }),
                  });
                  const data = await response.json();
                  if (!response.ok || !data.success) throw new Error(data.message || "AI generation failed");
                  const generatedPitch = extractGeneratedPitch(data);
                  if (!generatedPitch) {
                    throw new Error("AI did not return pitch content");
                  }
                  setPitch(generatedPitch);
                  toast({ title: "AI Pitch Generated", description: "You can edit or submit this pitch." });
                } catch (err) {
                  setAiError(err.message || "Failed to generate pitch");
                } finally {
                  setAiLoading(false);
                }
            }}
            disabled={aiLoading || banLoading}
          >
            <Send className="h-4 w-4" />
            {aiLoading ? "Generating..." : "Generate Pitch"}
          </Button>
          <Button
            type="button"
            variant={isAnalyzing ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={async () => {
              setIsAnalyzing(true);
              setAnalysisError(null);
              try {
                if (!pitch.trim() || !title.trim()) {
                  setAnalysisError("Please provide both title and pitch content.");
                  setIsAnalyzing(false);
                  return;
                }
                const response = await fetch("/api/ai/pitch-analysis", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pitch, title, category }),
                });
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || "AI analysis failed");
                setPitchAnalysis(data.analysis);
                toast({ title: "Pitch Analysis Complete", description: "See feedback below." });
              } catch (err) {
                setAnalysisError(err.message || "Failed to analyze pitch");
              } finally {
                setIsAnalyzing(false);
              }
            }}
            disabled={isAnalyzing || banLoading || !pitch.trim() || !title.trim()}
          >
            <AlertTriangle className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze Pitch"}
          </Button>
        </div>
        <MDEditor
          value={pitch}
          onChange={(value) => setPitch(value as string)}
          id="pitch"
          preview="edit"
          height={300}
          style={{ borderRadius: 20, overflow: "hidden" }}
          textareaProps={{
            placeholder: "Briefly describe your idea and what problem it solves",
            disabled: banLoading,
          }}
          previewOptions={{ disallowedElements: ["style"] }}
        />
        {pitchAnalysis && (
          <div className="mt-6 p-6 rounded-2xl bg-white shadow border border-gray-200 font-sans">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-2xl text-gray-900 tracking-tight">AI Pitch Analysis</span>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                Score: <span className="text-blue-700 font-bold">{pitchAnalysis.overallScore ? pitchAnalysis.overallScore : "-"}/10</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <span className="block font-semibold text-green-700 text-base mb-2">Strengths</span>
                  {pitchAnalysis.strengths?.length > 0 ? (
                    <ul className="ml-3 list-disc text-gray-800 text-sm">
                      {pitchAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
                <div>
                  <span className="block font-semibold text-red-600 text-base mb-2">Areas for Improvement</span>
                  {pitchAnalysis.weaknesses?.length > 0 ? (
                    <ul className="ml-3 list-disc text-gray-800 text-sm">
                      {pitchAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
              </div>
              {/* Column 2 */}
              <div className="space-y-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <span className="block font-semibold text-blue-700 text-base mb-2">AI Suggestions</span>
                  {pitchAnalysis.suggestions?.length > 0 ? (
                    <ul className="ml-3 list-disc text-gray-800 text-sm">
                      {pitchAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
                <div>
                  <span className="block font-semibold text-orange-600 text-base mb-2">Missing Elements</span>
                  {pitchAnalysis.missingElements?.length > 0 ? (
                    <ul className="ml-3 list-disc text-gray-800 text-sm">
                      {pitchAnalysis.missingElements.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
              </div>
              {/* Column 3 */}
              <div className="space-y-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <span className="block font-semibold text-purple-700 text-base mb-2">Market Insights</span>
                  {(pitchAnalysis.marketInsights?.marketSize || pitchAnalysis.marketInsights?.competition || pitchAnalysis.marketInsights?.trends) ? (
                    <ul className="ml-3 list-disc text-gray-800 text-sm">
                      {pitchAnalysis.marketInsights.marketSize && <li><span className="font-medium">Market Size:</span> {pitchAnalysis.marketInsights.marketSize}</li>}
                      {pitchAnalysis.marketInsights.competition && <li><span className="font-medium">Competition:</span> {pitchAnalysis.marketInsights.competition}</li>}
                      {pitchAnalysis.marketInsights.trends && <li><span className="font-medium">Trends:</span> {pitchAnalysis.marketInsights.trends}</li>}
                    </ul>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
                <div>
                  <span className="block font-semibold text-black text-base mb-2">Suggested Category</span>
                  <span className="font-medium text-gray-500 text-sm">{pitchAnalysis.category ? pitchAnalysis.category : "None"}</span>
                </div>
                <div>
                  <span className="block font-semibold text-black text-base mb-2">Suggested Tags</span>
                  {pitchAnalysis.tags?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pitchAnalysis.tags.map((tag, i) => (
                        <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">{tag}</span>
                      ))}
                    </div>
                  ) : <span className="ml-2 text-gray-400 text-sm">None listed</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="startup-form_btn text-white"
        disabled={isPending || isUploading || banLoading}
      >
        {isPending ? "Updating..." : isUploading ? "Uploading..." : banLoading ? "Checking..." : "Update Your Pitch"}
        <Send className="size-6 ml-2" />
      </Button>
    </form>
  );
};

const StartupEditForm = ({ startup }: StartupEditFormProps) => {
  return (
    <BanCheckWrapper>
      {({ isBanned, banMessage, isLoading: banLoading }) => (
        <StartupEditFormContent 
          startup={startup}
          isBanned={isBanned} 
          banMessage={banMessage} 
          banLoading={banLoading} 
        />
      )}
    </BanCheckWrapper>
  );
};

export default StartupEditForm; 