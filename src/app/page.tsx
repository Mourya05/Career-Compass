
"use client";

import React, { useState, type ReactNode, useEffect, Suspense } from 'react';
import { analyzeCompatibility, type AnalyzeCompatibilityInput, type AnalyzeCompatibilityOutput } from '@/ai/flows/analyze-compatibility';
import { suggestSkills, type SuggestSkillsInput, type SuggestSkillsOutput } from '@/ai/flows/suggest-skills';
import { recommendCertifications, type RecommendCertificationsInput, type RecommendCertificationsOutput } from '@/ai/flows/recommend-certifications';
import { buildResume, type BuildResumeInput, type BuildResumeOutput } from '@/ai/flows/build-resume';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingIcon } from "@/components/app/LoadingIcon";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Target, Brain, FileSignature, Lightbulb, Award, CheckCircle2, AlertCircle, Sparkles, Users, ListChecks, FileText, Download } from "lucide-react";
import Image from 'next/image';


interface SectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

function SectionCard({ title, description, icon, children }: SectionProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface ResultDisplayProps {
  title: string;
  icon?: ReactNode;
  content: string | Array<string | { name: string; url?: string; [key: string]: any }> | null | undefined;
  type?: 'text' | 'list' | 'progress';
  progressValue?: number;
  isLoading?: boolean;
  error?: string | null;
}

function ResultDisplay({ title, icon, content, type = 'text', progressValue, isLoading, error }: ResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-md border border-dashed flex items-center justify-center min-h-[100px]">
        <LoadingIcon /> <span className="ml-2">Loading {title}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error fetching {title}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!content && type !== 'progress' && !(Array.isArray(content) && content.length === 0) ) {
    return (
      <div className="p-4 rounded-md border border-dashed text-center text-muted-foreground min-h-[100px] flex items-center justify-center">
        No {title.toLowerCase()} data available yet.
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center">
        {icon && React.cloneElement(icon as React.ReactElement, { className: "mr-2 h-5 w-5 text-primary" })}
        {title}
      </h3>
      {type === 'progress' && progressValue !== undefined && (
        <div>
          <Progress value={progressValue} className="w-full h-3" />
          <p className="text-sm text-right font-medium mt-1">{progressValue}%</p>
        </div>
      )}
      {type === 'text' && typeof content === 'string' && (
        <div className="p-3 bg-secondary/30 rounded-md whitespace-pre-wrap text-sm leading-relaxed min-h-[100px]">{content}</div>
      )}
      {type === 'list' && Array.isArray(content) && (
         content.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 pl-2 min-h-[50px]">
            {content.map((item, index) => (
              <li key={index} className="text-sm">
                 {typeof item === 'string' ? item : (
                    item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )
                  )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3 bg-secondary/30 rounded-md text-sm text-muted-foreground min-h-[50px] flex items-center">No items to display.</div>
        )
      )}
    </div>
  );
}


export default function CareerCompassPage() {
  const { toast } = useToast();

  // Compatibility Analysis State
  const [currentUserDesc, setCurrentUserDesc] = useState<string>("");
  const [targetJobDesc, setTargetJobDesc] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCompatibilityOutput | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Skills & Certifications State
  const [jobMarketTrends, setJobMarketTrends] = useState<string>("");
  const [suggestedSkills, setSuggestedSkills] = useState<SuggestSkillsOutput | null>(null);
  const [recommendedCerts, setRecommendedCerts] = useState<RecommendCertificationsOutput | null>(null);
  const [loadingSkills, setLoadingSkills] = useState<boolean>(false);
  const [loadingCerts, setLoadingCerts] = useState<boolean>(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [certsError, setCertsError] = useState<string | null>(null);

  // Resume Builder State
  const [resumeSkills, setResumeSkills] = useState<string>(""); // Comma-separated
  const [resumeQualifications, setResumeQualifications] = useState<string>("");
  const [resumeTargetJobDesc, setResumeTargetJobDesc] = useState<string>("");
  const [generatedResume, setGeneratedResume] = useState<BuildResumeOutput | null>(null);
  const [loadingResume, setLoadingResume] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  
  const [atsScoreClient, setAtsScoreClient] = useState<number | null>(null);

  useEffect(() => {
    if (analysisResult?.atsScore !== undefined) {
      setAtsScoreClient(analysisResult.atsScore);
    }
  }, [analysisResult]);


  const handleAnalyzeCompatibility = async () => {
    if (!currentUserDesc || !targetJobDesc) {
      toast({ title: "Missing Fields", description: "Please fill in both current role and target job descriptions.", variant: "destructive" });
      return;
    }
    setLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const input: AnalyzeCompatibilityInput = { currentUserDescription: currentUserDesc, targetJobDescription: targetJobDesc };
      const result = await analyzeCompatibility(input);
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "Compatibility analysis finished successfully." });
      setResumeTargetJobDesc(targetJobDesc); 
    } catch (error) {
      console.error("Analysis Error:", error);
      setAnalysisError((error as Error).message || "Failed to analyze compatibility.");
      toast({ title: "Analysis Failed", description: "An error occurred during compatibility analysis.", variant: "destructive" });
    }
    setLoadingAnalysis(false);
  };

  const handleSuggestAndRecommend = async () => {
    if (!analysisResult?.skillGaps) {
      toast({ title: "Run Analysis First", description: "Please perform compatibility analysis before requesting suggestions.", variant: "destructive" });
      return;
    }

    setLoadingSkills(true);
    setLoadingCerts(true);
    setSkillsError(null);
    setCertsError(null);
    setSuggestedSkills(null);
    setRecommendedCerts(null);

    try {
      const skillsInput: SuggestSkillsInput = {
        userDescription: currentUserDesc,
        jobDescription: targetJobDesc,
        compatibilityAnalysis: analysisResult.compatibilityAnalysis,
      };
      const skillsResult = await suggestSkills(skillsInput);
      setSuggestedSkills(skillsResult);
      if (skillsResult.suggestedSkills && skillsResult.suggestedSkills.length > 0) {
        setResumeSkills(skillsResult.suggestedSkills.join(', '));
      }
      toast({ title: "Skill Suggestions Ready", description: "AI has suggested relevant skills." });
    } catch (error) {
      console.error("Suggest Skills Error:", error);
      setSkillsError((error as Error).message || "Failed to suggest skills.");
      toast({ title: "Skill Suggestion Failed", variant: "destructive" });
    }
    setLoadingSkills(false);

    try {
      if (!jobMarketTrends) {
        toast({ title: "Missing Field", description: "Please provide job market trends for certification recommendations.", variant: "destructive" });
        setCertsError("Job market trends are required.");
        setLoadingCerts(false);
        return;
      }
      const certsInput: RecommendCertificationsInput = {
        skillGaps: analysisResult.skillGaps,
        jobMarketTrends: jobMarketTrends,
      };
      const certsResult = await recommendCertifications(certsInput);
      setRecommendedCerts(certsResult);
      toast({ title: "Certification Recommendations Ready", description: "AI has recommended certifications." });
    } catch (error) {
      console.error("Recommend Certs Error:", error);
      setCertsError((error as Error).message || "Failed to recommend certifications.");
      toast({ title: "Certification Recommendation Failed", variant: "destructive" });
    }
    setLoadingCerts(false);
  };

  const handleBuildResume = async () => {
    if (!resumeTargetJobDesc || !resumeSkills || !resumeQualifications) {
      toast({ title: "Missing Fields", description: "Please fill target job, skills, and qualifications for resume building.", variant: "destructive" });
      return;
    }
    setLoadingResume(true);
    setResumeError(null);
    setGeneratedResume(null);
    try {
      const input: BuildResumeInput = {
        jobDescription: resumeTargetJobDesc,
        skills: resumeSkills.split(',').map(s => s.trim()).filter(s => s),
        qualifications: resumeQualifications,
      };
      const result = await buildResume(input);
      setGeneratedResume(result);
      toast({ title: "Resume Generated", description: "Your AI-powered resume is ready!" });
    } catch (error) {
      console.error("Resume Build Error:", error);
      setResumeError((error as Error).message || "Failed to build resume.");
      toast({ title: "Resume Generation Failed", variant: "destructive" });
    }
    setLoadingResume(false);
  };

  const handleDownloadResumeTxt = () => {
    if (generatedResume?.resume) {
      const element = document.createElement("a");
      const file = new Blob([generatedResume.resume], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = "ats_resume.txt";
      document.body.appendChild(element); 
      element.click();
      document.body.removeChild(element);
      toast({title: "Resume downloaded as TXT"});
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center space-x-3 mb-2">
          <Briefcase className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Career Compass</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Navigate Your Career Path with AI-Powered Insights
        </p>
      </header>

      <Tabs defaultValue="analysis" className="w-full max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6 rounded-lg">
          <TabsTrigger value="analysis" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Target className="mr-2 h-5 w-5" /> Compatibility Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Brain className="mr-2 h-5 w-5" /> Skills & Certifications
          </TabsTrigger>
          <TabsTrigger value="resume" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileSignature className="mr-2 h-5 w-5" /> Resume Builder
          </TabsTrigger>
        </TabsList>

        {/* Compatibility Analysis Tab */}
        <TabsContent value="analysis">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Input Your Details" icon={<Users className="h-6 w-6 text-accent" />} description="Provide your current experience and the job you're targeting.">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentUserDesc" className="text-base">Your Current Role / Experience</Label>
                  <Textarea id="currentUserDesc" value={currentUserDesc} onChange={(e) => setCurrentUserDesc(e.target.value)} placeholder="Describe your current role, responsibilities, and achievements..." rows={8} className="text-base"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetJobDesc" className="text-base">Target Job Description</Label>
                  <Textarea id="targetJobDesc" value={targetJobDesc} onChange={(e) => setTargetJobDesc(e.target.value)} placeholder="Paste the job description you are interested in..." rows={8} className="text-base"/>
                </div>
                <Button onClick={handleAnalyzeCompatibility} disabled={loadingAnalysis} className="w-full py-3 text-base">
                  {loadingAnalysis ? <LoadingIcon className="mr-2" /> : <Target className="mr-2 h-5 w-5" />}
                  Analyze Compatibility
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Analysis Results" icon={<ListChecks className="h-6 w-6 text-accent" />} description="See how well you match the target role and identify areas for growth.">
              <div className="space-y-6">
                <ResultDisplay title="ATS Score" icon={<Sparkles />} type="progress" progressValue={atsScoreClient ?? undefined} isLoading={loadingAnalysis} error={analysisError && !analysisResult ? analysisError : null}/>
                <ResultDisplay title="Compatibility Analysis" icon={<Users />} content={analysisResult?.compatibilityAnalysis} isLoading={loadingAnalysis} error={analysisError && !analysisResult?.compatibilityAnalysis ? analysisError : null} />
                <ResultDisplay title="Skill Gaps" icon={<AlertCircle />} type="list" content={analysisResult?.skillGaps?.split('\n').map(s => s.trim()).filter(s => s) || []} isLoading={loadingAnalysis} error={analysisError && !analysisResult?.skillGaps ? analysisError : null} />
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Skills & Certifications Tab */}
        <TabsContent value="recommendations">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Market Insights" icon={<Lightbulb className="h-6 w-6 text-accent" />} description="Provide current job market trends to refine recommendations.">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="jobMarketTrends" className="text-base">Current Job Market Trends</Label>
                        <Textarea id="jobMarketTrends" value={jobMarketTrends} onChange={(e) => setJobMarketTrends(e.target.value)} placeholder="e.g., High demand for cloud skills, AI/ML expertise is a plus, Remote work proficiency..." rows={5} className="text-base"/>
                    </div>
                    <Button onClick={handleSuggestAndRecommend} disabled={loadingSkills || loadingCerts || !analysisResult} className="w-full py-3 text-base">
                        {(loadingSkills || loadingCerts) ? <LoadingIcon className="mr-2" /> : <Brain className="mr-2 h-5 w-5" />}
                        Get Suggestions & Recommendations
                    </Button>
                     {!analysisResult && <p className="text-sm text-amber-400 text-center mt-2">Perform Compatibility Analysis first to enable this section.</p>}
                </div>
            </SectionCard>
            
            <SectionCard title="Development Path" icon={<Award className="h-6 w-6 text-accent" />} description="Discover skills to learn and certifications to pursue.">
                 <div className="space-y-6">
                    <ResultDisplay title="Suggested Skills" icon={<Lightbulb />} type="list" content={suggestedSkills?.suggestedSkills} isLoading={loadingSkills} error={skillsError} />
                    {suggestedSkills?.reasoning && !loadingSkills && !skillsError && (
                        <div className="p-3 bg-secondary/30 rounded-md">
                            <h4 className="font-semibold text-sm mb-1">Reasoning:</h4>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{suggestedSkills.reasoning}</p>
                        </div>
                    )}
                    <ResultDisplay title="Recommended Certifications" icon={<Award />} type="list" content={recommendedCerts?.certifications || []} isLoading={loadingCerts} error={certsError} />
                </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Resume Builder Tab */}
        <TabsContent value="resume">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Resume Inputs" icon={<FileSignature className="h-6 w-6 text-accent" />} description="Provide details to tailor your resume.">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="resumeTargetJobDesc" className="text-base">Target Job Description</Label>
                        <Textarea id="resumeTargetJobDesc" value={resumeTargetJobDesc} onChange={(e) => setResumeTargetJobDesc(e.target.value)} placeholder="Paste the target job description here (pre-filled from analysis if available)..." rows={6} className="text-base"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resumeSkills" className="text-base">Your Skills (comma-separated)</Label>
                        <Input id="resumeSkills" value={resumeSkills} onChange={(e) => setResumeSkills(e.target.value)} placeholder="e.g., Python, JavaScript, Project Management (pre-filled from suggestions if available)" className="text-base"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resumeQualifications" className="text-base">Your Qualifications / Experience Summary</Label>
                        <Textarea id="resumeQualifications" value={resumeQualifications} onChange={(e) => setResumeQualifications(e.target.value)} placeholder="Summarize your key qualifications, experience, and achievements. Include contact info, education, and work history here for the AI to use." rows={8} className="text-base"/>
                    </div>
                    <Button onClick={handleBuildResume} disabled={loadingResume} className="w-full py-3 text-base">
                        {loadingResume ? <LoadingIcon className="mr-2" /> : <FileSignature className="mr-2 h-5 w-5" />}
                        Build My Resume
                    </Button>
                </div>
            </SectionCard>

            <SectionCard title="Generated Resume" icon={<CheckCircle2 className="h-6 w-6 text-accent" />} description="Review your AI-crafted resume. Copy or download and refine as needed.">
                 <div className="space-y-4">
                    <ResultDisplay title="Resume Content" content={generatedResume?.resume} isLoading={loadingResume} error={resumeError} />
                    {generatedResume?.resume && !loadingResume && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(generatedResume.resume).then(() => toast({title: "Copied to clipboard!"}))}
                            className="flex-1"
                        >
                            <FileText className="mr-2 h-4 w-4" /> Copy Text
                        </Button>
                        <Button variant="outline" onClick={handleDownloadResumeTxt} className="flex-1">
                            <Download className="mr-2 h-4 w-4" /> Download TXT
                        </Button>
                      </div>
                    )}
                </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
      
      <footer className="text-center mt-16 py-8 border-t border-border">
        <p className="text-muted-foreground">
          &copy; {new Date().getFullYear()} Career Compass. Powered by AI.
        </p>
         <Image src="https://placehold.co/150x50" alt="Placeholder Logo" width={150} height={50} className="mx-auto mt-4 opacity-50" data-ai-hint="abstract tech logo"/>
      </footer>
    </div>
  );
}

