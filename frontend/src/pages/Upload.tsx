import { useState } from "react";
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { useAuth, type UserPreferences } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [batchPreference, setBatchPreference] = useState<UserPreferences["batchPreference"]>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, updatePreferences } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const effectiveBatchPreference = batchPreference;

    if (!effectiveBatchPreference) {
      setShowPreferenceModal(true);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("excelFile", file);
    formData.append("userId", user?.id || "");

    try {
      const response = await fetch(`${API_BASE_URL}/timetable/upload-excel`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast({
        title: "Success!",
        description: "File uploaded and parsed successfully.",
      });

      // After upload, generate timetables
      const genResponse = await fetch(`${API_BASE_URL}/timetable/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          semesterConfigId: data.semesterConfigId,
          preferences: {
            batchPreference: effectiveBatchPreference,
            rankingCriteria: user?.preferences.rankingCriteria || "balanced",
            maxTimetables: user?.preferences.maxTimetables || 12,
          },
        }),
      });

      const genData = await genResponse.json();

      if (!genResponse.ok) {
        throw new Error(genData.error || "Generation failed");
      }

      toast({
        title: "Timetables Generated",
        description: `Found ${genData.timetablesCount} valid schedules.`,
      });
      if (genData.warning) {
        toast({
          title: "Heads up",
          description: genData.warning,
        });
      }

      navigate("/results", { state: { timetableData: genData } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreferenceSelection = async (selected: "Morning" | "Evening") => {
    setBatchPreference(selected);
    try {
      await updatePreferences({ batchPreference: selected });
      setShowPreferenceModal(false);
      toast({
        title: "Preference saved",
        description: `${selected} slots will be used for timetable generation.`,
      });
    } catch (error) {
      toast({
        title: "Failed to save preference",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <Dialog open={showPreferenceModal} onOpenChange={setShowPreferenceModal}>
        <DialogContent className="bg-background/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle>Select your slot preference</DialogTitle>
            <DialogDescription>
              Choose one option. We will prioritize this batch and use mixed slots only if required to form a valid timetable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handlePreferenceSelection("Morning")}>
              Morning Slots
            </Button>
            <Button variant="outline" onClick={() => handlePreferenceSelection("Evening")}>
              Evening Slots
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPreferenceModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="mb-10 reveal">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            Timetable Generator
          </span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-black text-gradient leading-tight">
          Upload Your <span className="text-primary-gradient">Course Data</span>
        </h1>
        <p className="text-text-secondary mt-3 max-w-xl">
          Upload your course list or paste your VTOP data. Our AI will generate
          optimal, conflict-free timetables in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2">
          <GlassCard hover={false} className="reveal">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : file
                  ? "border-success bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{file.name}</p>
                    <p className="text-text-muted text-sm mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Ready to process
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all ${isDragging
                      ? "bg-primary/30 scale-110"
                      : "bg-primary/20"
                      }`}
                  >
                    <UploadIcon
                      className={`w-8 h-8 transition-all ${isDragging ? "text-primary scale-110" : "text-primary/70"
                        }`}
                    />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">
                      Drop your file here
                    </p>
                    <p className="text-text-muted text-sm mt-1">
                      or click to browse • CSV, XLSX, JSON supported
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <Button
                size="lg"
                disabled={!file || isUploading}
                onClick={handleUpload}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity gap-2 shadow-glow"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isUploading ? "Processing..." : "Generate Timetables"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              {file && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setFile(null)}
                  className="border-border hover:border-primary/50 hover:bg-primary/5"
                >
                  Clear
                </Button>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <GlassCard className="reveal">
            <h3 className="font-display font-bold flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              How It Works
            </h3>
            <ol className="space-y-3">
              {[
                "Export your course list from VTOP",
                "Upload the file or paste data",
                "Set your preferences (optional)",
                "Get AI-optimized schedules instantly",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{step}</span>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
