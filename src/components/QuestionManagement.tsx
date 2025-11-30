import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { QuestionForm } from "./QuestionForm";

export function QuestionManagement() {
  const questions = useQuery(api.questions.list, {});
  const members = useQuery(api.councilMembers.list, {});
  const deleteQuestion = useMutation(api.questions.remove);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Doc<"questions"> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered" | "archived">("all");
  const [filterMember, setFilterMember] = useState<string>("all");

  const [editingQuestionId, setEditingQuestionId] = useState<Id<"questions"> | null>(null);
  const editingQuestionDetail = useQuery(
    api.questions.getById,
    editingQuestionId ? { questionId: editingQuestionId } : "skip"
  );

  const handleEdit = (question: Doc<"questions">) => {
    setEditingQuestionId(question._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: Id<"questions">) => {
    if (confirm("この質問を削除してもよろしいですか？")) {
      try {
        await deleteQuestion({ questionId: id });
      } catch (error) {
        console.error("Failed to delete question:", error);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
    setEditingQuestionId(null);
  };

  const handleFormSuccess = () => {
    // Form will close automatically
  };

  const getMemberName = (memberId: Id<"councilMembers">) => {
    return members?.find(m => m._id === memberId)?.name || "不明";
  };

  const filteredQuestions = questions?.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || question.status === filterStatus;
    const matchesMember = filterMember === "all" || question.councilMemberId === filterMember;
    
    return matchesSearch && matchesStatus && matchesMember;
  });

  if (!questions || !members) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 animate-amano-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400 flex items-center space-x-2 amano-text-glow">
            <span>📜</span>
            <span>質問管理</span>
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            議会質問の追加・編集・削除
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow"
        >
          ➕ 新しい質問を追加
        </button>
      </div>

      {/* Filters */}
      <div className="amano-bg-glass rounded-xl p-4 space-y-4 amano-crystal-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="タイトル、内容、カテゴリで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input-field"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="auth-input-field"
            >
              <option value="all">全てのステータス</option>
              <option value="pending">回答待ち</option>
              <option value="answered">回答済み</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>
          <div>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">全ての議員</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions && filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <div key={question._id} className="amano-bg-glass rounded-xl p-6 amano-crystal-border hover:shadow-2xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      question.status === "answered" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : question.status === "pending"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                        : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                    }`}>
                      {question.status === "answered" ? "回答済み" : 
                       question.status === "pending" ? "回答待ち" : "アーカイブ"}
                    </span>
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {question.category}
                    </span>
                    <span className="text-gray-400 text-xs">
                      📅 {new Date(question.sessionDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-200 mb-2 line-clamp-2">
                    {question.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {question.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      👤 {getMemberName(question.councilMemberId)}
                    </span>
                    {question.sessionNumber && (
                      <span className="flex items-center">
                        📋 {question.sessionNumber}
                      </span>
                    )}
                    {question.youtubeUrl && (
                      <span className="flex items-center text-red-400">
                        📺 動画あり
                      </span>
                    )}
                    {question.documentUrl && (
                      <span className="flex items-center text-blue-400">
                        📄 資料あり
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(question)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 amano-bg-glass rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterStatus !== "all" || filterMember !== "all" 
                ? "条件に一致する質問が見つかりません" 
                : "質問が登録されていません"}
            </p>
            {!searchTerm && filterStatus === "all" && filterMember === "all" && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105"
              >
                最初の質問を追加
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <QuestionForm
          question={editingQuestionDetail}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
