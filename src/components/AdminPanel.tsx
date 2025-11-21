import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { QuestionManagement } from "./QuestionManagement";
import { NewsManagement } from "./NewsManagement";
import { UserManagement } from "./UserManagement";
import { SlideshowManagement } from "./SlideshowManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("members");
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <p className="text-gray-300 text-lg">アクセス権限がありません</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "members", label: "議員管理", icon: "⚔️" },
    { id: "questions", label: "質問管理", icon: "📜" },
    { id: "news", label: "お知らせ管理", icon: "✨" },
    { id: "slideshow", label: "スライドショー管理", icon: "🖼️" },
  ];

  // Super admin only tabs
  if (isSuperAdmin) {
    tabs.push({ id: "users", label: "ユーザー管理", icon: "👑" });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "slideshow":
        return <SlideshowManagement />;
      case "users":
        return isSuperAdmin ? <UserManagement /> : <div className="text-gray-300">アクセス権限がありません</div>;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="amano-bg-card rounded-2xl p-6 sm:p-8 amano-crystal-border">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 flex items-center justify-center text-2xl animate-amano-glow">
            👑
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
              管理画面
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
              システム管理・コンテンツ編集
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-300">ログイン中:</span>
          <span className="text-yellow-400 font-medium amano-text-glow">{user.name || user.email}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSuperAdmin 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" 
              : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
          }`}>
            {isSuperAdmin ? "運営者" : "編集者"}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="amano-bg-glass rounded-xl p-2 amano-crystal-border">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-500 transform hover:scale-105 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                  : "text-gray-300 amano-bg-card hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="amano-bg-card rounded-2xl p-6 sm:p-8 amano-crystal-border animate-fadeIn">
        {renderContent()}
      </div>
    </div>
  );
}
