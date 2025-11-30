import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function ExternalArticleManagement() {
  const [activeTab, setActiveTab] = useState<"sources" | "articles">("sources");
  const [showAddSourceForm, setShowAddSourceForm] = useState(false);
  const [showAddArticleForm, setShowAddArticleForm] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testSourceType, setTestSourceType] = useState<"blog" | "rss">("rss");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [fetchingSourceId, setFetchingSourceId] = useState<Id<"externalSources"> | null>(null);
  
  // 一括削除用の状態
  const [selectedArticles, setSelectedArticles] = useState<Set<Id<"externalArticles">>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const sources = useQuery(api.externalArticles.listSources);
  const articles = useQuery(api.externalArticles.list, { limit: 50 });
  const councilMembers = useQuery(api.councilMembers.list, { activeOnly: true });

  const addExternalSource = useMutation(api.externalArticles.addExternalSource);
  const updateExternalSource = useMutation(api.externalArticles.updateExternalSource);
  const deleteExternalSource = useMutation(api.externalArticles.deleteExternalSource);
  const addExternalArticle = useMutation(api.externalArticles.addExternalArticle);
  const updateExternalArticle = useMutation(api.externalArticles.updateExternalArticle);
  const deleteExternalArticle = useMutation(api.externalArticles.deleteExternalArticle);
  const testFeedUrl = useAction(api.externalArticles.testFeedUrl);
  const fetchFromSource = useAction(api.externalArticles.fetchFromSource);

  const [sourceForm, setSourceForm] = useState({
    councilMemberId: "",
    sourceType: "blog" as const,
    sourceUrl: "",
    sourceName: "",
    fetchInterval: 60,
    isActive: true,
  });

  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    originalUrl: "",
    imageUrl: "",
    publishedAt: Date.now(),
    councilMemberId: "",
    sourceId: "",
    category: "その他" as const,
    isActive: true,
  });

  const resetSourceForm = () => {
    setSourceForm({
      councilMemberId: "",
      sourceType: "blog",
      sourceUrl: "",
      sourceName: "",
      fetchInterval: 60,
      isActive: true,
    });
    setEditingSource(null);
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: "",
      content: "",
      excerpt: "",
      originalUrl: "",
      imageUrl: "",
      publishedAt: Date.now(), // 現在時刻を自動設定
      councilMemberId: "",
      sourceId: "",
      category: "その他",
      isActive: true,
    });
    setEditingArticle(null);
  };

  const handleEditSource = (source: any) => {
    setSourceForm({
      councilMemberId: source.councilMemberId,
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
      sourceName: source.sourceName || "",
      fetchInterval: source.fetchInterval || 60,
      isActive: source.isActive,
    });
    setEditingSource(source);
    setShowAddSourceForm(true);
  };

  const handleEditArticle = (article: any) => {
    setArticleForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || "",
      originalUrl: article.originalUrl,
      imageUrl: article.imageUrl || "",
      publishedAt: article.publishedAt,
      councilMemberId: article.councilMemberId,
      sourceId: article.sourceId,
      category: article.category,
      isActive: article.isActive,
    });
    setEditingArticle(article);
    setShowAddArticleForm(true);
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await updateExternalSource({
          id: editingSource._id,
          councilMemberId: sourceForm.councilMemberId as Id<"councilMembers">,
          sourceType: sourceForm.sourceType,
          sourceUrl: sourceForm.sourceUrl,
          sourceName: sourceForm.sourceName || undefined,
          fetchInterval: sourceForm.fetchInterval,
          isActive: sourceForm.isActive,
        });
      } else {
        await addExternalSource({
          councilMemberId: sourceForm.councilMemberId as Id<"councilMembers">,
          sourceType: sourceForm.sourceType,
          sourceUrl: sourceForm.sourceUrl,
          sourceName: sourceForm.sourceName || undefined,
          fetchInterval: sourceForm.fetchInterval,
        });
      }
      setShowAddSourceForm(false);
      resetSourceForm();
    } catch (error) {
      console.error("ソース保存エラー:", error);
      alert(error instanceof Error ? error.message : "ソースの保存に失敗しました");
    }
  };

  const handleDeleteSource = async (sourceId: Id<"externalSources">) => {
    if (!confirm("このソースを削除しますか？関連する記事は残りますが、今後の自動取得は停止されます。")) {
      return;
    }
    
    try {
      await deleteExternalSource({ id: sourceId });
    } catch (error) {
      console.error("ソース削除エラー:", error);
      alert(error instanceof Error ? error.message : "ソースの削除に失敗しました");
    }
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await updateExternalArticle({
          id: editingArticle._id,
          title: articleForm.title,
          content: articleForm.content,
          excerpt: articleForm.excerpt || undefined,
          originalUrl: articleForm.originalUrl,
          imageUrl: articleForm.imageUrl || undefined,
          publishedAt: articleForm.publishedAt,
          category: articleForm.category,
          isActive: articleForm.isActive,
        });
      } else {
        await addExternalArticle({
          title: articleForm.title,
          content: articleForm.content,
          excerpt: articleForm.excerpt || undefined,
          originalUrl: articleForm.originalUrl,
          imageUrl: articleForm.imageUrl || undefined,
          publishedAt: articleForm.publishedAt,
          councilMemberId: articleForm.councilMemberId as Id<"councilMembers">,
          sourceId: articleForm.sourceId as Id<"externalSources">,
          category: articleForm.category,
        });
      }
      setShowAddArticleForm(false);
      resetArticleForm();
    } catch (error) {
      console.error("記事保存エラー:", error);
      alert(error instanceof Error ? error.message : "記事の保存に失敗しました");
    }
  };

  const handleDeleteArticle = async (articleId: Id<"externalArticles">) => {
    if (!confirm("この記事を削除しますか？")) {
      return;
    }
    
    try {
      await deleteExternalArticle({ id: articleId });
    } catch (error) {
      console.error("記事削除エラー:", error);
      alert(error instanceof Error ? error.message : "記事の削除に失敗しました");
    }
  };

  // 記事の選択状態を切り替え
  const handleArticleSelect = (articleId: Id<"externalArticles">) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  // 全選択/全解除
  const handleSelectAll = () => {
    if (selectedArticles.size === articles?.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles?.map(article => article._id) || []));
    }
  };

  // 一括削除
  const handleBulkDelete = async () => {
    if (selectedArticles.size === 0) {
      alert("削除する記事を選択してください");
      return;
    }

    if (!confirm(`選択した${selectedArticles.size}件の記事を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedArticles).map(articleId =>
        deleteExternalArticle({ id: articleId })
      );
      
      await Promise.all(deletePromises);
      setSelectedArticles(new Set());
      alert(`${selectedArticles.size}件の記事を削除しました`);
    } catch (error) {
      console.error("一括削除エラー:", error);
      alert(error instanceof Error ? error.message : "記事の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestUrl = async () => {
    if (!testUrl.trim()) return;
    
    setIsTestingUrl(true);
    setTestResult(null);
    
    try {
      const result = await testFeedUrl({
        url: testUrl,
        sourceType: testSourceType,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "テストに失敗しました",
        articles: [],
        totalCount: 0,
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleFetchFromSource = async (sourceId: Id<"externalSources">) => {
    setFetchingSourceId(sourceId);
    
    try {
      const result = await fetchFromSource({ sourceId });
      alert(result.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : "記事の取得に失敗しました");
    } finally {
      setFetchingSourceId(null);
    }
  };

  const sourceTypes = [
    { value: "blog", label: "ブログ", icon: "📝" },
    { value: "facebook", label: "Facebook", icon: "📘" },
    { value: "twitter", label: "Twitter", icon: "🐦" },
    { value: "instagram", label: "Instagram", icon: "📷" },
    { value: "rss", label: "RSS", icon: "📡" },
  ];

  const categories = [
    "政策・提案",
    "活動報告", 
    "市政情報",
    "地域イベント",
    "お知らせ",
    "その他"
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📰 外部記事管理
        </h2>
        <p className="text-gray-300 mt-2">議員のブログやSNSの記事ソースと記事を管理します</p>
      </div>

      {/* URL テストセクション */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">🧪 フィードURLテスト</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com/feed.xml または https://example.com/blog/"
                className="auth-input-field"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={testSourceType}
                onChange={(e) => setTestSourceType(e.target.value as any)}
                className="auth-input-field flex-1"
              >
                <option value="rss">RSS/XML</option>
                <option value="blog">ブログ</option>
              </select>
              <button
                onClick={handleTestUrl}
                disabled={!testUrl.trim() || isTestingUrl}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingUrl ? "テスト中..." : "テスト"}
              </button>
            </div>
          </div>

          {/* テスト結果 */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-900 border border-green-600' : 'bg-red-900 border border-red-600'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{testResult.success ? "✅" : "❌"}</span>
                <span className="font-medium">{testResult.message}</span>
              </div>
              
              {testResult.success && testResult.articles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-200 mb-2">取得された記事（最初の5件）:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testResult.articles.map((article: any, index: number) => (
                      <div key={index} className="bg-black bg-opacity-30 p-3 rounded-lg">
                        <h5 className="font-medium text-sm text-gray-200 line-clamp-1">{article.title}</h5>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{article.description}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-yellow-400">
                            リンク →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex space-x-1 amano-bg-card rounded-lg p-1">
        <button
          onClick={() => setActiveTab("sources")}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
            activeTab === "sources"
              ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white"
              : "text-gray-300 hover:text-white"
          }`}
        >
          📡 記事ソース管理
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
            activeTab === "articles"
              ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white"
              : "text-gray-300 hover:text-white"
          }`}
        >
          📝 記事管理
        </button>
      </div>

      {/* 記事ソース管理 */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-yellow-400 amano-text-glow">記事ソース一覧</h3>
            <button
              onClick={() => {
                resetSourceForm();
                setShowAddSourceForm(true);
              }}
              className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105"
            >
              ➕ ソース追加
            </button>
          </div>

          {/* ソース追加・編集フォーム */}
          {showAddSourceForm && (
            <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
              <h4 className="text-lg font-bold text-yellow-400 mb-4">
                {editingSource ? "記事ソースを編集" : "新しい記事ソースを追加"}
              </h4>
              <form onSubmit={handleAddSource} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">議員</label>
                    <select
                      value={sourceForm.councilMemberId}
                      onChange={(e) => setSourceForm({ ...sourceForm, councilMemberId: e.target.value })}
                      className="auth-input-field"
                      required
                    >
                      <option value="">議員を選択</option>
                      {councilMembers?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.politicalParty || "無所属"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ソースタイプ</label>
                    <select
                      value={sourceForm.sourceType}
                      onChange={(e) => setSourceForm({ ...sourceForm, sourceType: e.target.value as any })}
                      className="auth-input-field"
                    >
                      {sourceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ソースURL</label>
                  <input
                    type="url"
                    value={sourceForm.sourceUrl}
                    onChange={(e) => setSourceForm({ ...sourceForm, sourceUrl: e.target.value })}
                    className="auth-input-field"
                    placeholder="https://example.com/blog"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ソース名（任意）</label>
                  <input
                    type="text"
                    value={sourceForm.sourceName}
                    onChange={(e) => setSourceForm({ ...sourceForm, sourceName: e.target.value })}
                    className="auth-input-field"
                    placeholder="○○議員のブログ"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">取得間隔（分）</label>
                    <input
                      type="number"
                      value={sourceForm.fetchInterval}
                      onChange={(e) => setSourceForm({ ...sourceForm, fetchInterval: parseInt(e.target.value) })}
                      className="auth-input-field"
                      min="15"
                      max="1440"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">状態</label>
                    <select
                      value={sourceForm.isActive ? "active" : "inactive"}
                      onChange={(e) => setSourceForm({ ...sourceForm, isActive: e.target.value === "active" })}
                      className="auth-input-field"
                    >
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="auth-button"
                  >
                    {editingSource ? "ソースを更新" : "ソースを追加"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSourceForm(false);
                      resetSourceForm();
                    }}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ソース一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources?.map((source) => (
              <div key={source._id} className="amano-bg-card rounded-xl p-4 amano-crystal-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg">
                    {sourceTypes.find(t => t.value === source.sourceType)?.icon}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      source.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    }`}>
                      {source.isActive ? "有効" : "無効"}
                    </span>
                    <button
                      onClick={() => handleFetchFromSource(source._id)}
                      disabled={fetchingSourceId === source._id}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fetchingSourceId === source._id ? "取得中..." : "🔄"}
                    </button>
                  </div>
                </div>
                <h4 className="font-medium text-gray-200 mb-2">
                  {source.sourceName || `${source.councilMember?.name}の${sourceTypes.find(t => t.value === source.sourceType)?.label}`}
                </h4>
                <p className="text-sm text-gray-400 mb-2">{source.councilMember?.name}</p>
                <p className="text-xs text-gray-500 break-all mb-3">{source.sourceUrl}</p>
                <div className="text-xs text-gray-400 mb-3">
                  <p>取得間隔: {source.fetchInterval}分</p>
                  <p>最終取得: {source.lastFetchedAt ? formatDate(source.lastFetchedAt) : "未取得"}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditSource(source)}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-3 py-1 rounded text-xs font-medium hover:from-yellow-500 hover:to-orange-500 transition-all duration-300"
                  >
                    ✏️ 編集
                  </button>
                  <button
                    onClick={() => handleDeleteSource(source._id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded text-xs font-medium hover:from-red-500 hover:to-pink-500 transition-all duration-300"
                  >
                    🗑️ 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 記事管理 */}
      {activeTab === "articles" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-yellow-400 amano-text-glow">記事一覧</h3>
            <div className="flex space-x-2">
              {/* 一括削除ボタン */}
              {selectedArticles.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "削除中..." : `🗑️ 選択した${selectedArticles.size}件を削除`}
                </button>
              )}
              <button
                onClick={() => {
                  resetArticleForm();
                  setShowAddArticleForm(true);
                }}
                className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105"
              >
                ➕ 記事追加
              </button>
            </div>
          </div>

          {/* 一括選択コントロール */}
          {articles && articles.length > 0 && (
            <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedArticles.size === articles.length && articles.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-gray-300">
                      {selectedArticles.size === articles.length ? "全解除" : "全選択"}
                    </span>
                  </label>
                  <span className="text-sm text-gray-400">
                    {selectedArticles.size > 0 ? `${selectedArticles.size}件選択中` : `全${articles.length}件`}
                  </span>
                </div>
                {selectedArticles.size > 0 && (
                  <button
                    onClick={() => setSelectedArticles(new Set())}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    選択をクリア
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 記事追加・編集フォーム */}
          {showAddArticleForm && (
            <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
              <h4 className="text-lg font-bold text-yellow-400 mb-4">
                {editingArticle ? "記事を編集" : "新しい記事を追加"}
              </h4>
              <form onSubmit={handleAddArticle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">議員</label>
                    <select
                      value={articleForm.councilMemberId}
                      onChange={(e) => setArticleForm({ ...articleForm, councilMemberId: e.target.value })}
                      className="auth-input-field"
                      required
                      disabled={!!editingArticle}
                    >
                      <option value="">議員を選択</option>
                      {councilMembers?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ソース</label>
                    <select
                      value={articleForm.sourceId}
                      onChange={(e) => setArticleForm({ ...articleForm, sourceId: e.target.value })}
                      className="auth-input-field"
                      required
                      disabled={!!editingArticle}
                    >
                      <option value="">ソースを選択</option>
                      {sources?.filter(s => s.councilMemberId === articleForm.councilMemberId).map((source) => (
                        <option key={source._id} value={source._id}>
                          {source.sourceName || `${sourceTypes.find(t => t.value === source.sourceType)?.label}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">タイトル</label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="auth-input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">カテゴリー</label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as any })}
                      className="auth-input-field"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">状態</label>
                    <select
                      value={articleForm.isActive ? "active" : "inactive"}
                      onChange={(e) => setArticleForm({ ...articleForm, isActive: e.target.value === "active" })}
                      className="auth-input-field"
                    >
                      <option value="active">公開</option>
                      <option value="inactive">非公開</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">要約（任意）</label>
                  <textarea
                    value={articleForm.excerpt}
                    onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                    className="auth-input-field"
                    rows={3}
                    placeholder="記事の要約を入力..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">本文</label>
                  <textarea
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    className="auth-input-field"
                    rows={8}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">元記事URL</label>
                    <input
                      type="url"
                      value={articleForm.originalUrl}
                      onChange={(e) => setArticleForm({ ...articleForm, originalUrl: e.target.value })}
                      className="auth-input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">画像URL（任意）</label>
                    <input
                      type="url"
                      value={articleForm.imageUrl}
                      onChange={(e) => setArticleForm({ ...articleForm, imageUrl: e.target.value })}
                      className="auth-input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">投稿日</label>
                  <div className="auth-input-field bg-gray-800 text-gray-400">
                    {new Date(articleForm.publishedAt).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {editingArticle 
                      ? "参考元サイトから取得された投稿日時です" 
                      : "記事追加時に参考元サイトから自動取得されます"
                    }
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="auth-button"
                  >
                    {editingArticle ? "記事を更新" : "記事を追加"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddArticleForm(false);
                      resetArticleForm();
                    }}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 記事一覧 */}
          <div className="space-y-4">
            {articles?.map((article) => (
              <div key={article._id} className="amano-bg-card rounded-xl p-4 amano-crystal-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* チェックボックス */}
                    <label className="flex items-center mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(article._id)}
                        onChange={() => handleArticleSelect(article._id)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                    </label>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                          {article.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          article.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}>
                          {article.isActive ? "公開" : "非公開"}
                        </span>
                        <span className="text-xs text-gray-400">投稿: {formatDate(article.publishedAt)}</span>
                      </div>
                      <h4 className="font-medium text-gray-200 mb-2">{article.title}</h4>
                      {article.excerpt && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span>{article.councilMember?.name}</span>
                        <span>👁️ {article.viewCount || 0}</span>
                        <a
                          href={article.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-yellow-400 transition-colors"
                        >
                          元記事 →
                        </a>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-3 py-1 rounded text-xs font-medium hover:from-yellow-500 hover:to-orange-500 transition-all duration-300"
                        >
                          ✏️ 編集
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article._id)}
                          className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded text-xs font-medium hover:from-red-500 hover:to-pink-500 transition-all duration-300"
                        >
                          🗑️ 削除
                        </button>
                      </div>
                    </div>
                  </div>
                  {article.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden ml-4">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
