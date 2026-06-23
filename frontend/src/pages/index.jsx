import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Send, Download, Search, Settings, Loader2, Brain,
  Shield, Zap, ChevronRight, Inbox
} from 'lucide-react';
import * as api from '@/utils/api';

// ============================================
// Main Dashboard
// ============================================
export default function Dashboard() {
  const [step, setStep] = useState('dashboard'); // dashboard | upload | review | processing | results
  const [questionnaires, setQuestionnaires] = useState([]);
  const [currentQ, setCurrentQ] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQ, setSelectedQ] = useState(null);
  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState([]);

  // Load questionnaires on mount
  useState(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      const res = await api.listQuestionnaires();
      setQuestionnaires(res.questionnaires || []);
    } catch (e) {
      console.error('Failed to load questionnaires:', e);
    }
  };

  const handleCreateQuestionnaire = async (name) => {
    try {
      const res = await api.createQuestionnaire({ name, source_format: 'excel' });
      setCurrentQ(res);
      setStep('upload');
      toast.success('Questionnaire created!');
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    }
  };

  const handleFileUpload = async (file) => {
    if (!currentQ) return;
    try {
      await api.uploadQuestionnaire(currentQ.id, file);
      toast.success('File uploaded and parsed!');
      const qRes = await api.getQuestions(currentQ.id);
      setQuestions(qRes.questions || []);
      setStep('review');
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
    }
  };

  const handleGenerateAnswers = async () => {
    if (!currentQ) return;
    setStep('processing');
    try {
      toast.loading('Generating AI answers...', { id: 'gen' });
      await api.generateAnswers(currentQ.id);
      toast.success('Answers generated!', { id: 'gen' });
      const qRes = await api.getQuestions(currentQ.id);
      setQuestions(qRes.questions || []);
      setStep('review');
    } catch (e) {
      toast.error(`Generation failed: ${e.message}`, { id: 'gen' });
      setStep('review');
    }
  };

  const handleApprove = async (questionId) => {
    try {
      await api.approveAnswer(currentQ.id, questionId);
      toast.success('Answer approved');
      const qRes = await api.getQuestions(currentQ.id);
      setQuestions(qRes.questions || []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReject = async (questionId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.rejectAnswer(currentQ.id, questionId, reason);
      toast.success('Answer rejected');
      const qRes = await api.getQuestions(currentQ.id);
      setQuestions(qRes.questions || []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await api.exportQuestionnaire(currentQ.id, format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `questionnaire_${currentQ.id}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      toast.success('Export downloaded!');
    } catch (e) {
      toast.error(`Export failed: ${e.message}`);
    }
  };

  const handleKBSearch = async () => {
    if (!kbQuery.trim()) return;
    try {
      const res = await api.searchKB(kbQuery);
      setKbResults(res.results || []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">SecQ-Auto</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button onClick={() => setStep('dashboard')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              Dashboard
            </button>
            <button onClick={() => setStep('kb')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 'kb' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              Knowledge Base
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard View */}
        {step === 'dashboard' && (
          <DashboardView
            questionnaires={questionnaires}
            onCreate={handleCreateQuestionnaire}
            onSelect={(q) => { setCurrentQ(q); setStep('review');
              api.getQuestions(q.id).then(r => setQuestions(r.questions || [])).catch(() => {}); }}
          />
        )}

        {/* Upload View */}
        {step === 'upload' && currentQ && (
          <UploadView questionnaire={currentQ} onUpload={handleFileUpload} onBack={() => setStep('dashboard')} />
        )}

        {/* Review View */}
        {step === 'review' && currentQ && (
          <ReviewView
            questionnaire={currentQ}
            questions={questions}
            onGenerate={handleGenerateAnswers}
            onApprove={handleApprove}
            onReject={handleReject}
            onExport={handleExport}
            onBack={() => setStep('dashboard')}
          />
        )}

        {/* Processing View */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Generating AI Answers...</h2>
            <p className="text-slate-500">Our agents are analyzing your questionnaire and retrieving relevant answers.</p>
          </div>
        )}

        {/* Knowledge Base View */}
        {step === 'kb' && (
          <KBView
            query={kbQuery}
            setQuery={setKbQuery}
            results={kbResults}
            onSearch={handleKBSearch}
          />
        )}
      </main>
    </div>
  );
}

// ============================================
// Dashboard View Component
// ============================================
function DashboardView({ questionnaires, onCreate, onSelect }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName);
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Questionnaires</h2>
          <p className="text-slate-500 mt-1">Manage and automate your vendor security questionnaires</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          New Questionnaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{questionnaires.length}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{questionnaires.filter(q => q.status === 'completed').length}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{questionnaires.filter(q => q.status === 'in_review').length}</p>
              <p className="text-sm text-slate-500">In Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Questionnaire</h3>
            <input
              className="input mb-4"
              placeholder="Questionnaire name (e.g., Acme Corp Security Review)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire List */}
      {questionnaires.length === 0 ? (
        <div className="card text-center py-12">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No questionnaires yet</h3>
          <p className="text-slate-500 mb-4">Upload your first security questionnaire to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Questionnaire</button>
        </div>
      ) : (
        <div className="space-y-3">
          {questionnaires.map((q) => (
            <div key={q.id} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(q)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <h3 className="font-medium text-slate-900">{q.name}</h3>
                    <p className="text-sm text-slate-500">
                      {q.progress?.total || 0} questions · Created {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={q.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Upload View Component
// ============================================
function UploadView({ questionnaire, onUpload, onBack }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1">
        ← Back to Dashboard
      </button>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Questionnaire</h2>
      <p className="text-slate-500 mb-6">Upload your security questionnaire file. Supported formats: Excel, CSV, PDF.</p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the file here...</p>
        ) : (
          <>
            <p className="text-slate-700 font-medium mb-1">Drag & drop your questionnaire file</p>
            <p className="text-sm text-slate-500">or click to browse · Excel, CSV, PDF</p>
          </>
        )}
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium text-slate-900 mb-2">💡 Tips for best results</h3>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Use Excel (.xlsx) format for best parsing accuracy</li>
          <li>• Include columns: Section, Number, Question, Type, Required</li>
          <li>• Make sure questions are in a single sheet</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Review View Component
// ============================================
function ReviewView({ questionnaire, questions, onGenerate, onApprove, onReject, onExport, onBack }) {
  const [editingQ, setEditingQ] = useState(null);
  const [editText, setEditText] = useState('');

  const hasAnswers = questions.some(q => q.answer);
  const approvedCount = questions.filter(q => q.answer?.status === 'approved').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-slate-500 hover:text-slate-700 mb-1 flex items-center gap-1">
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{questionnaire.name}</h2>
          <p className="text-slate-500">{questions.length} questions · {approvedCount} approved</p>
        </div>
        <div className="flex gap-2">
          {!hasAnswers && questions.length > 0 && (
            <button onClick={onGenerate} className="btn-primary flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Generate AI Answers
            </button>
          )}
          {hasAnswers && (
            <>
              <button onClick={() => onExport('excel')} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button onClick={() => onExport('csv')} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No questions loaded</h3>
          <p className="text-slate-500">Upload a questionnaire file first</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              onApprove={() => onApprove(q.id)}
              onReject={() => onReject(q.id)}
              isEditing={editingQ === q.id}
              editText={editText}
              setEditText={setEditText}
              onStartEdit={() => { setEditingQ(q.id); setEditText(q.answer?.text || ''); }}
              onSaveEdit={() => { setEditingQ(null); toast.success('Answer updated'); }}
              onCancelEdit={() => setEditingQ(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Question Card Component
// ============================================
function QuestionCard({ question, index, onApprove, onReject, isEditing, editText, setEditText, onStartEdit, onSaveEdit, onCancelEdit }) {
  const answer = question.answer;
  const confidenceColor = answer?.confidence >= 0.8 ? 'text-emerald-600' : answer?.confidence >= 0.5 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-400">{question.number}</span>
            <span className="badge badge-info">{question.section || 'General'}</span>
            <span className="text-xs text-slate-400">{question.type}</span>
            {question.required && <span className="badge badge-danger">Required</span>}
          </div>
          <p className="text-slate-900 font-medium mb-3">{question.text}</p>

          {answer && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              {isEditing ? (
                <div>
                  <textarea
                    className="input mb-2"
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary text-sm" onClick={onSaveEdit}>Save</button>
                    <button className="btn-secondary text-sm" onClick={onCancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 mb-2">{answer.text}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={confidenceColor}>
                      Confidence: {(answer.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-400">
                      {answer.processing_time_ms}ms
                    </span>
                    <AnswerStatusBadge status={answer.status} />
                  </div>
                  {answer.reasoning && (
                    <p className="text-xs text-slate-500 mt-2 italic">💭 {answer.reasoning}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {answer && !isEditing && (
          <div className="flex flex-col gap-1">
            {answer.status !== 'approved' && (
              <>
                <button onClick={onApprove} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={onReject} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject">
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Knowledge Base View
// ============================================
function KBView({ query, setQuery, results, onSearch }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Knowledge Base</h2>
      <p className="text-slate-500 mb-6">Search your company documents, policies, and previous answers</p>

      <div className="flex gap-2 mb-6">
        <input
          className="input flex-1"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button onClick={onSearch} className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">{r.doc_name || 'Unknown'}</span>
                <span className="badge badge-info">{(r.score * 100).toFixed(0)}% match</span>
              </div>
              <p className="text-sm text-slate-600">{r.text?.substring(0, 300)}...</p>
            </div>
          ))}
        </div>
      ) : query ? (
        <div className="card text-center py-8">
          <p className="text-slate-500">No results found. Try different keywords.</p>
        </div>
      ) : (
        <div className="card text-center py-8">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Enter a search query to find relevant documents</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Status Badge Component
// ============================================
function StatusBadge({ status }) {
  const config = {
    uploading: { label: 'Uploading', class: 'badge-info' },
    ready: { label: 'Ready', class: 'badge-info' },
    in_review: { label: 'In Review', class: 'badge-warning' },
    completed: { label: 'Completed', class: 'badge-success' },
    exported: { label: 'Exported', class: 'badge-success' },
  };
  const c = config[status] || { label: status, class: 'badge-info' };
  return <span className={`badge ${c.class}`}>{c.label}</span>;
}

function AnswerStatusBadge({ status }) {
  const config = {
    draft: { label: 'Draft', class: 'badge-info' },
    validated: { label: 'Validated', class: 'badge-success' },
    approved: { label: 'Approved', class: 'badge-success' },
    rejected: { label: 'Rejected', class: 'badge-danger' },
    needs_review: { label: 'Needs Review', class: 'badge-warning' },
  };
  const c = config[status] || { label: status, class: 'badge-info' };
  return <span className={`badge ${c.class}`}>{c.label}</span>;
}
