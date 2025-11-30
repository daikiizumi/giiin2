import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { QuestionManagement } from "./QuestionManagement";
import { NewsManagement } from "./NewsManagement";
import { SlideshowManagement } from "./SlideshowManagement";
import { UserManagement } from "./UserManagement";
import { ContactManagement } from "./ContactManagement";
import { FAQManagement } from "./FAQManagement";
import { ExternalArticleManagement } from "./ExternalArticleManagement";
import { MenuManagement } from "./MenuManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const isAdmin = useQuery(api.admin.isAdmin);

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">アクセス拒否</h2>
        <p className="text-gray-300">
          この機能を利用するには管理者権限が必要です。
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "概要", icon: "📊" },
    { id: "menu", name: "メニュー設定", icon: "🎛️" },
    { id: "members", name: "議員管理", icon: "👥" },
    { id: "questions", name: "質問管理", icon: "❓" },
    { id: "news", name: "お知らせ管理", icon: "📢" },
    { id: "slideshow", name: "スライドショー", icon: "🖼️" },
    { id: "external", name: "外部記事管理", icon: "📰" },
    { id: "faq", name: "FAQ管理", icon: "💡" },
    { id: "contact", name: "お問い合わせ", icon: "📧" },
    { id: "users", name: "ユーザー管理", icon: "👤" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "menu":
        return <MenuManagement />;
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "slideshow":
        return <SlideshowManagement />;
      case "external":
        return <ExternalArticleManagement />;
      case "faq":
        return <FAQManagement />;
      case "contact":
        return <ContactManagement />;
      case "users":
        return <UserManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          🛠️ 管理パネル
        </h1>
        <p className="text-gray-300">
          サイトの各種設定と管理機能
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
}

function AdminOverview() {
  const stats = useQuery(api.admin.getStats);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">統計を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
        📊 システム概要
      </h2>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.memberCount}</div>
          <div className="text-gray-300">議員数</div>
        </div>

        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">❓</div>
          <div className="text-2xl font-bold text-purple-400">{stats.questionCount}</div>
          <div className="text-gray-300">質問数</div>
        </div>

        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">👤</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.userCount}</div>
          <div className="text-gray-300">ユーザー数</div>
        </div>

        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">📢</div>
          <div className="text-2xl font-bold text-green-400">{stats.newsCount}</div>
          <div className="text-gray-300">お知らせ数</div>
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          📈 最近の活動
        </h3>
        <div className="space-y-4">
          {stats.recentQuestions?.map((question: any) => (
            <div key={question._id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-2xl">❓</div>
              <div className="flex-1">
                <div className="font-medium text-gray-200">{question.title}</div>
                <div className="text-sm text-gray-400">
                  {new Date(question.sessionDate).toLocaleDateString("ja-JP")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* システム情報 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          ⚙️ システム情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">バージョン:</span>
            <span className="ml-2 text-gray-200">1.0.0</span>
          </div>
          <div>
            <span className="text-gray-400">最終更新:</span>
            <span className="ml-2 text-gray-200">{new Date().toLocaleDateString("ja-JP")}</span>
          </div>
          <div>
            <span className="text-gray-400">データベース:</span>
            <span className="ml-2 text-green-400">正常</span>
          </div>
          <div>
            <span className="text-gray-400">認証システム:</span>
            <span className="ml-2 text-green-400">正常</span>
          </div>
        </div>
      </div>
    </div>
  );
}
