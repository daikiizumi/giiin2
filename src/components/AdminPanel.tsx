import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { QuestionManagement } from "./QuestionManagement";
import { NewsManagement } from "./NewsManagement";
import { UserManagement } from "./UserManagement";
import { UserStatistics } from "./UserStatistics";
import { ContactManagement } from "./ContactManagement";
import { FAQManagement } from "./FAQManagement";
import { ExternalArticleManagement } from "./ExternalArticleManagement";
import { SlideshowManagement } from "./SlideshowManagement";
import { MenuManagement } from "./MenuManagement";
import { DataMigration } from "./DataMigration";
import { CleanupManagement } from "./CleanupManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const isAdmin = useQuery(api.admin.isAdmin);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  
  // 管理者権限がある場合のみ統計情報を取得
  const stats = useQuery(api.admin.getStats, isAdmin ? {} : "skip");
  const userStats = useQuery(api.admin.getUserStats, isAdmin ? {} : "skip");

  // 管理者権限がない場合はアクセス拒否
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">アクセス拒否</h2>
          <p className="text-gray-400">管理者権限が必要です</p>
        </div>
      </div>
    );
  }

  // ローディング中
  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "概要", icon: "📊" },
    { id: "members", name: "議員管理", icon: "👥" },
    { id: "questions", name: "質問管理", icon: "❓" },
    { id: "news", name: "お知らせ管理", icon: "📢" },
    { id: "articles", name: "記事管理", icon: "📰" },
    { id: "slideshow", name: "スライドショー", icon: "🖼️" },
    { id: "faq", name: "FAQ管理", icon: "💡" },
    { id: "contact", name: "お問い合わせ", icon: "📧" },
    { id: "menu", name: "メニュー設定", icon: "🔧" },
    { id: "users", name: "ユーザー管理", icon: "👤" },
    { id: "userStats", name: "ユーザー統計", icon: "📈" },
    { id: "cleanup", name: "データクリーンアップ", icon: "🧹" },
    ...(isSuperAdmin ? [{ id: "migration", name: "データ移行", icon: "🔄" }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">👥</span>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.memberCount || 0}</p>
                    <p className="text-gray-400 text-sm">議員数</p>
                  </div>
                </div>
              </div>
              
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">❓</span>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.questionCount || 0}</p>
                    <p className="text-gray-400 text-sm">質問数</p>
                  </div>
                </div>
              </div>
              
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">👤</span>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.userCount || 0}</p>
                    <p className="text-gray-400 text-sm">ユーザー数</p>
                  </div>
                </div>
              </div>
              
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📢</span>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.newsCount || 0}</p>
                    <p className="text-gray-400 text-sm">お知らせ数</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 統計情報がロード中の場合の表示 */}
            {!stats && isAdmin && (
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              </div>
            )}

            {stats?.recentQuestions && stats.recentQuestions.length > 0 && (
              <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">最近の質問</h3>
                <div className="space-y-3">
                  {stats.recentQuestions.map((question) => (
                    <div key={question._id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-200">{question.title}</p>
                        <p className="text-sm text-gray-400">質問ID: {question._id}</p>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(question.sessionDate).toLocaleDateString("ja-JP")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "articles":
        return <ExternalArticleManagement />;
      case "slideshow":
        return <SlideshowManagement />;
      case "faq":
        return <FAQManagement />;
      case "contact":
        return <ContactManagement />;
      case "menu":
        return <MenuManagement />;
      case "users":
        return <UserManagement />;
      case "userStats":
        return <UserStatistics />;
      case "cleanup":
        return <CleanupManagement />;
      case "migration":
        return isSuperAdmin ? <DataMigration /> : null;
      default:
        return <div>タブが見つかりません</div>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          🛠️ 管理パネル
        </h1>
        <div className="text-sm text-gray-400">
          権限: {isSuperAdmin ? "スーパー管理者" : "管理者"}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="amano-bg-card rounded-xl p-2 amano-crystal-border">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg"
                  : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}
