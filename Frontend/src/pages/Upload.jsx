import React, { useRef, useState, useEffect } from 'react'
import { useAppDispatch, useCurrentUpload, useUploadLoading } from '../store/hooks'
import { useNavigate } from 'react-router-dom';
import { uploadResume, clearCurrentUpload, fetchResumeDetail } from '../store/slices/resumeSlice';
import { 
  FileText, 
  Upload as UploadIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  History,
  Command,
  Sparkles,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';

const Upload = () => {
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [fileError, setFileError] = useState('');
    const [resumeId, setResumeId] = useState(null);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    const dispatch = useAppDispatch();
    const currentUpload = useCurrentUpload();
    const uploadLoading = useUploadLoading();
    const navigate = useNavigate();
    
    const isThrottled = useRef(false);

    // Poll for analysis completion
    useEffect(() => {
        if (resumeId && !analysisComplete && pollCount < 30) {
            const timer = setTimeout(() => {
                dispatch(fetchResumeDetail(resumeId)).then((result) => {
                    if (result.payload && result.payload.analyzed_at) {
                        setAnalysisComplete(true);
                        setAnalysisProgress(100);
                    } else {
                        setPollCount(prev => prev + 1);
                        setAnalysisProgress(Math.min((pollCount / 30) * 100, 95));
                    }
                });
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [resumeId, analysisComplete, pollCount, dispatch]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        setFileError('');
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setFileError('Please select a PDF file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFileError('File size must be less than 5MB.');
            return;
        }
        setSelectedFiles(file);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Hard guard
        if (isThrottled.current || uploadLoading) return;

        if (!selectedFiles) {
            setFileError('Please select a file to upload.');
            return;
        }

        try {
            isThrottled.current = true;

            // Reset state
            setResumeId(null);
            setAnalysisComplete(false);
            setPollCount(0);
            setAnalysisProgress(0);

            // Use unwrap() for proper error handling
            const payload = await dispatch(uploadResume(selectedFiles)).unwrap();

            const id = payload.id;
            setResumeId(id);
            setSelectedFiles(null);
            setFileError('');
            setPollCount(0);

        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            // Release lock ONLY when async finished
            isThrottled.current = false;
        }
    };

    const handleReset = () => {
        dispatch(clearCurrentUpload());
        setSelectedFiles(null);
        setResumeId(null);
        setAnalysisComplete(false);
        setPollCount(0);
        setAnalysisProgress(0);
    }

    return (
        <div className="min-h-screen bg-[#FBFBFB] px-4 py-16 font-sans selection:bg-gray-900 selection:text-white">
            <div className="max-w-4xl mx-auto">
                
                {/* Minimalist Navigation/Breadcrumb */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                            <Command className="h-5 w-5 text-white" />
                        </div>
                        <div className="h-4 w-px bg-gray-200 mx-1" />
                        <span className="text-sm font-medium text-gray-500 tracking-tight">AI Analyzer v1.0</span>
                    </div>
                    <button 
                        onClick={() => navigate('/history')}
                        className="text-sm font-medium text-gray-400 hover:text-black transition-colors flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        Archive
                    </button>
                </div>

                {/* Hero Section */}
                <div className="mb-12">
                    <h1 className="text-5xl font-semibold text-gray-900 tracking-tight leading-tight">
                        Optimize your <span className="text-gray-400">career</span> <br />
                        with LPU intelligence.
                    </h1>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
                    
                    {/* UPLOAD FORM STATE */}
                    {!resumeId || !analysisComplete ? (
                        <div className="p-10 sm:p-16">
                            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-10">
                                <div 
                                    className={`relative group border-2 border-dashed rounded-[24px] p-12 transition-all duration-300 flex flex-col items-center justify-center
                                        ${selectedFiles ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/50'}`}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        disabled={uploadLoading || (resumeId && !analysisComplete)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    
                                    <div className={`p-5 rounded-2xl mb-6 shadow-sm transition-all duration-300 ${selectedFiles ? 'bg-black text-white scale-110' : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                                        {selectedFiles ? <FileText className="h-8 w-8" /> : <UploadIcon className="h-8 w-8" />}
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xl font-medium text-gray-900">
                                            {selectedFiles ? selectedFiles.name : 'Select Resume'}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2 font-medium uppercase tracking-widest">
                                            {selectedFiles ? `${(selectedFiles.size / 1024 / 1024).toFixed(2)} MB` : 'PDF • Maximum 5MB'}
                                        </p>
                                    </div>
                                </div>

                                {fileError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {fileError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!selectedFiles || uploadLoading || (resumeId && !analysisComplete)}
                                    className="w-full flex justify-center items-center py-5 px-8 text-lg font-bold rounded-2xl text-white bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-xl shadow-black/5"
                                >
                                    {uploadLoading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                            Processing PDF...
                                        </>
                                    ) : resumeId && !analysisComplete ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                            Analyzing with Groq...
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-2">Analyze <Zap className="h-5 w-5 fill-current" /></span>
                                    )}
                                </button>
                            </form>

                            {/* ANALYZING STATE - Show progress while analyzing */}
                            {resumeId && !analysisComplete && (
                                <div className="mt-12 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                                                <Sparkles className="h-5 w-5 text-blue-600 animate-spin" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-blue-900">🚀 AI Analysis in Progress</p>
                                                <p className="text-xs text-blue-700 mt-1">Groq LPU is processing your resume (5-15 seconds)</p>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${analysisProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-blue-600 font-medium mt-3">{Math.round(analysisProgress)}% Complete</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : currentUpload && currentUpload.data ? (
                        /* SUCCESS RESULTS STATE */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Visual Score Display */}
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-10 sm:p-14 bg-black text-white flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-green-400 mb-8">
                                            <Sparkles className="h-4 w-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Insights Ready</span>
                                        </div>
                                        <h2 className="text-6xl font-light tracking-tighter italic">
                                            {currentUpload.data.overall_score || currentUpload.data.overall_score === 0 
                                                ? currentUpload.data.overall_score 
                                                : 'N/A'}
                                            <span className="text-2xl text-gray-600 font-normal">/100</span>
                                        </h2>
                                        <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-bold">Overall Rating</p>
                                    </div>
                                    <div className="mt-12 flex gap-8">
                                        <div>
                                            <p className="text-4xl font-light">
                                                {currentUpload.data.ats_score || currentUpload.data.ats_score === 0 
                                                    ? currentUpload.data.ats_score 
                                                    : 'N/A'}%
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ATS Match</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 sm:p-14 space-y-12">
                                    {/* Missing Skills */}
                                    {currentUpload.data.missing_skills && currentUpload.data.missing_skills.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-2 mb-6">
                                                <Target className="h-4 w-4 text-black" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Target Skills</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {currentUpload.data.missing_skills.map((skill, i) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-900 text-[11px] font-bold rounded-full transition-colors hover:bg-black hover:text-white cursor-default">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Critical Feedback */}
                                    {currentUpload.data.weaknesses && currentUpload.data.weaknesses.length > 0 && (
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-1 bg-black rounded-full" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Critical Feedback</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                {currentUpload.data.weaknesses.slice(0, 5).map((w, i) => (
                                                    <li key={i} className="text-sm text-gray-600 font-medium leading-relaxed pl-4 border-l-2 border-orange-100">
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </div>

                            {/* Sticky-style Bottom Action Bar */}
                            <div className="border-t border-gray-50 p-8 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
                                <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:shadow-md transition-all">
                                    <Plus className="h-4 w-4" /> New Analysis
                                </button>
                                <button onClick={() => navigate('/history')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                                    View All <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ERROR STATE */
                        <div className="p-20 text-center animate-in zoom-in-95">
                            <div className="inline-flex p-6 bg-red-50 text-red-600 rounded-[24px] mb-6">
                                <AlertCircle className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 italic">Processing Error</h3>
                            <p className="text-gray-500 mt-2 mb-10 max-w-xs mx-auto font-medium">{currentUpload?.error || "The AI model timed out. Please try a different PDF."}</p>
                            <button onClick={handleReset} className="px-10 py-4 bg-black text-white rounded-2xl font-bold shadow-xl shadow-black/10 transition-transform active:scale-95">Restart</button>
                        </div>
                    )}
                </div>

                {/* Aesthetic Tech Stack Badge */}
                <div className="mt-16 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase">Groq LPU</span>
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase">Celery</span>
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase">PostgreSQL</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Upload;