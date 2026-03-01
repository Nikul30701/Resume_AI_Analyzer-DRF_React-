import React, { useEffect } from 'react';
import { useAppDispatch, useCurrentResume, useDetailLoading, useHistoryLoading, useResumeHistory } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { fetchResumeHistory, fetchResumeDetail, deleteResume } from '../store/slices/resumeSlice';
import { 
  FileText, 
  Trash2, 
  ChevronLeft, 
  Search, 
  Activity, 
  Target, 
  Zap, 
  Lightbulb, 
  ShieldAlert,
  Calendar,
  ArrowUpRight,
  Loader2
} from 'lucide-react';

const History = () => {
    const dispatch = useAppDispatch();
    const history = useResumeHistory();
    const historyLoading = useHistoryLoading();
    const currentResume = useCurrentResume();
    const detailLoading = useDetailLoading();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchResumeHistory());
    }, [dispatch]);

    const handleViewDetails = (id) => dispatch(fetchResumeDetail(id));

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Archive this analysis permanently?')) {
            await dispatch(deleteResume(id));
            dispatch(fetchResumeHistory());
        }
    };

    // Ensure history is an array
    const resumesList = Array.isArray(history) ? history : [];

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans selection:bg-black selection:text-white">
            
            {/* Top Navigation Bar */}
            <nav className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/upload')}
                    className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
                >
                    <div className="p-1 rounded-md group-hover:bg-gray-100 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    Back to Upload
                </button>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Active</span>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Resume List */}
                <aside className="w-full lg:w-80 border-r border-gray-100 bg-white flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Vault</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search history..." 
                                className="w-full bg-gray-50 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Loading...</span>
                            </div>
                        ) : resumesList.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-sm text-gray-400 italic">No records found.</p>
                            </div>
                        ) : (
                            resumesList.map((resume) => (
                                <button
                                    key={resume.id}
                                    onClick={() => handleViewDetails(resume.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group relative
                                        ${currentResume?.id === resume.id 
                                            ? 'bg-black text-white shadow-lg shadow-black/10' 
                                            : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold truncate pr-4">{resume.file_name}</p>
                                        <ArrowUpRight className={`h-3 w-3 opacity-50 ${currentResume?.id === resume.id ? 'block' : 'hidden group-hover:block'}`} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${currentResume?.id === resume.id ? 'text-gray-400' : 'text-gray-400'}`}>
                                            Score: {resume.overall_score}
                                        </span>
                                        <span className="text-[10px] opacity-40">•</span>
                                        <span className="text-[10px] font-medium opacity-60">
                                            {new Date(resume.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main: Detail View */}
                <main className="flex-1 bg-[#FBFBFB] overflow-y-auto p-6 lg:p-12">
                    {detailLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <Loader2 className="h-10 w-10 animate-spin mb-4" />
                            <p className="text-sm font-medium tracking-widest uppercase">Fetching Intelligence...</p>
                        </div>
                    ) : currentResume ? (
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Processed {new Date(currentResume.analyzed_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">{currentResume.file_name}</h1>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(currentResume.id, e)}
                                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Record
                                </button>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                <div className="bg-black rounded-3xl p-8 text-white flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Analysis Score</p>
                                        <div className="text-5xl font-light italic">
                                            {currentResume.overall_score || currentResume.overall_score === 0 
                                                ? currentResume.overall_score 
                                                : 'N/A'}
                                            <span className="text-xl text-gray-700">/100</span>
                                        </div>
                                    </div>
                                    <Activity className="h-12 w-12 text-gray-800" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-3xl p-8 flex justify-between items-center shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">ATS Compatibility</p>
                                        <div className="text-5xl font-light italic text-gray-900">
                                            {currentResume.ats_score || currentResume.ats_score === 0 
                                                ? currentResume.ats_score 
                                                : 'N/A'}
                                            <span className="text-xl text-gray-300">%</span>
                                        </div>
                                    </div>
                                    <Target className="h-12 w-12 text-gray-100" />
                                </div>
                            </div>

                            {/* Detailed Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Strengths */}
                                {currentResume.strengths && currentResume.strengths.length > 0 && (
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <Zap className="h-4 w-4 text-black" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Key Strengths</h3>
                                        </div>
                                        <ul className="space-y-4">
                                            {currentResume.strengths.map((s, i) => (
                                                <li key={i} className="flex gap-4 text-sm font-medium text-gray-700">
                                                    <span className="text-black font-bold">0{i+1}</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Improvements */}
                                {currentResume.weaknesses && currentResume.weaknesses.length > 0 && (
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <ShieldAlert className="h-4 w-4 text-black" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Critical Gaps</h3>
                                        </div>
                                        <ul className="space-y-4">
                                            {currentResume.weaknesses.map((w, i) => (
                                                <li key={i} className="flex gap-4 text-sm font-medium text-gray-500 leading-relaxed">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>

                            {/* Suggestions Footer */}
                            {currentResume.improvement_suggestions && currentResume.improvement_suggestions.length > 0 && (
                                <div className="mt-16 bg-white border border-gray-100 rounded-[32px] p-8 lg:p-12 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Lightbulb className="h-5 w-5 text-black" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Strategic Roadmap</h3>
                                    </div>
                                    <div className="space-y-8">
                                        {currentResume.improvement_suggestions.map((suggestion, idx) => (
                                            <div key={idx} className="group flex gap-6">
                                                <span className="text-4xl font-light italic text-gray-100 group-hover:text-black transition-colors duration-500">{(idx + 1).toString().padStart(2, '0')}</span>
                                                <p className="text-gray-600 text-sm font-medium leading-relaxed pt-2">{suggestion}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100">
                                <FileText className="h-6 w-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Select an entry to begin</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default History;