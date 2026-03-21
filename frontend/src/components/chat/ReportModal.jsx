import React, { useRef } from 'react';
import { X, FileText, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReportModal = ({ isOpen, onClose, reportData, patientName, isGenerating }) => {
    const reportRef = useRef();

    if (!isOpen) return null;

    const handleDownload = () => {
        const element = reportRef.current;
        const opt = {
            margin: 1,
            filename: `DrConsole_Report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const triageColors = {
        'Green': 'bg-green-100 text-green-800 border-green-200',
        'Yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Red': 'bg-red-100 text-red-800 border-red-200'
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl text-teal-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">Consultation Report</h2>
                            <p className="text-sm text-gray-500 font-medium">Auto-generated Clinical Summary</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isGenerating && reportData && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Save PDF
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative bg-gray-50">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-800">Synthesizing Medical Data...</h3>
                            <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
                                Dr. Console is analyzing the chat history, visual inputs, and medical knowledge base to formulate your structured report.
                            </p>
                        </div>
                    ) : reportData ? (
                        <div
                            ref={reportRef}
                            className="bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-gray-200"
                        >
                            {/* PDF Letterhead */}
                            <div className="flex justify-between items-start border-b-2 border-teal-600 pb-6 mb-8">
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">DR. CONSOLE</h1>
                                    <p className="text-sm text-teal-700 font-semibold tracking-wide uppercase mt-1">Autonomous Pre-Screening Engine</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">Date: {new Date().toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500">Patient: <span className="font-semibold text-gray-800">{patientName}</span></p>
                                </div>
                            </div>

                            {/* Triage & Summary */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className={`flex-1 rounded-xl p-4 border ${triageColors[reportData.triage_level] || 'bg-gray-100 border-gray-200'}`}>
                                    <p className="text-xs uppercase tracking-wider font-bold mb-1 opacity-80">Triage Assignment</p>
                                    <h3 className="text-xl font-black mb-1">{reportData.triage_level || 'Pending'} Code</h3>
                                    <p className="text-sm opacity-90">{reportData.triage_reason || 'No specific reason provided.'}</p>
                                </div>
                                <div className="flex-[2] bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Patient Summary</p>
                                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                        {reportData.patient_summary || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Clinical Note Body */}
                            <div className="space-y-6 text-gray-800 text-sm">
                                <div>
                                    <h4 className="font-bold text-teal-800 border-b border-gray-100 pb-2 mb-3">SUBJECTIVE (S)</h4>
                                    <p className="leading-relaxed bg-white">{reportData.subjective || 'No subjective symptoms reported.'}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-teal-800 border-b border-gray-100 pb-2 mb-3">OBJECTIVE (O)</h4>
                                    <p className="leading-relaxed">{reportData.objective || 'No objective findings or test results uploaded.'}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-teal-800 border-b border-gray-100 pb-2 mb-3">ASSESSMENT (A)</h4>
                                    <p className="leading-relaxed">{reportData.assessment || 'No assessment could be formulated.'}</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-teal-800 border-b border-gray-100 pb-2 mb-3">PLAN (P)</h4>
                                    <p className="leading-relaxed">{reportData.plan || 'No specific plan outlined.'}</p>
                                </div>

                                <div className="mt-8 bg-blue-50/50 p-4 border border-blue-100 rounded-lg">
                                    <h4 className="font-bold text-blue-900 border-b border-blue-200/50 pb-2 mb-3">AI CLINICAL ASSUMPTION</h4>
                                    <p className="leading-relaxed text-blue-800 italic">{reportData.ai_assumption || 'Pending AI reasoning.'}</p>
                                </div>
                            </div>

                            {/* Disclaimer Footer */}
                            <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                                <p className="text-xs text-gray-400 font-medium">
                                    * This report was auto-generated by Dr. Console's multimodal AI engine. *
                                    <br />It is intended for preliminary triage only and does not replace a formal medical diagnosis from a licensed physician.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            Failed to load report data. Please try generating it again.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ReportModal;
