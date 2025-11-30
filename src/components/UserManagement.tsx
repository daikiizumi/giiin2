import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function UserManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const userStats = useQuery(api.admin.getUserStats);
  const allUsers = useQuery(api.admin.getAllUsers);
  const adminList = useQuery(api.admin.listAdmins);
  const currentUserRole = useQuery(api.admin.getUserRole);
  
  const addAdmin = useMutation(api.admin.addAdmin);
  const removeAdmin = useMutation(api.admin.removeAdmin);
  const deleteUser = useMutation(api.admin.deleteUser);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "user" | "admin" | "superAdmin">("all");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!userStats || !allUsers || !adminList || !currentUserRole) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleGrantAdmin = async (userId: Id<"users">, role: "admin" | "superAdmin") => {
    if (!confirm(`このユーザーに${role === "superAdmin" ? "スーパー管理者" : "管理者"}権限を付与しますか？`)) {
      return;
    }

    setIsProcessing(userId);
    try {
      await addAdmin({ userId, role });
    } catch (error) {
      console.error("Failed to grant admin:", error);
      alert("権限付与に失敗しました: " + (error as Error).message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRevokeAdmin = async (userId: Id<"users">) => {
    if (!confirm("このユーザーの管理者権限を削除しますか？")) {
      return;
    }

    setIsProcessing(userId);
    try {
      await removeAdmin({ userId });
    } catch (error) {
      console.error("Failed to revoke admin:", error);
      alert("権限削除に失敗しました: " + (error as Error).message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    if (!confirm("このユーザーアカウントを完全に削除しますか？\n※この操作は取り消せません。")) {
      return;
    }

    setIsProcessing(userId);
    try {
      await deleteUser({ userId });
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("ユーザー削除に失敗しました: " + (error as Error).message);
    } finally {
      setIsProcessing(null);
    }
  };

  const getUserRole = (userId: Id<"users">) => {
    const admin = adminList.find(admin => admin.userId === userId);
    return admin ? admin.role : "user";
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = getUserRole(user._id);
    const matchesRole = filterRole === "all" || userRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const tabs = [
    { id: "overview", name: "統計概要", icon: "📊" },
    { id: "users", name: "ユーザー一覧", icon: "👥" },
    { id: "admins", name: "管理者一覧", icon: "🛡️" },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-yellow-400">{userStats.totalUsers}</div>
          <div className="text-gray-300">総ユーザー数</div>
        </div>

        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-purple-400">{userStats.totalDemographics}</div>
          <div className="text-gray-300">属性情報登録済み</div>
        </div>

        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-cyan-400">
            {userStats.totalUsers > 0 ? Math.round((userStats.totalDemographics / userStats.totalUsers) * 100) : 0}%
          </div>
          <div className="text-gray-300">登録率</div>
        </div>
      </div>

      {/* 年代別統計 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          📊 年代別統計
        </h3>
        <div className="space-y-2">
          {userStats.ageGroups.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{item.label}</span>
              <span className="text-yellow-400 font-bold">{item.count}人</span>
            </div>
          ))}
        </div>
      </div>

      {/* 性別統計 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          👫 性別統計
        </h3>
        <div className="space-y-2">
          {userStats.genders.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{item.label}</span>
              <span className="text-purple-400 font-bold">{item.count}人</span>
            </div>
          ))}
        </div>
      </div>

      {/* 地域統計 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          🗺️ 地域統計
        </h3>
        <div className="space-y-2">
          {userStats.regions.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{item.label}</span>
              <span className="text-cyan-400 font-bold">{item.count}人</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsersList = () => (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="amano-bg-glass rounded-xl p-4 amano-crystal-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="名前またはメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input-field"
            />
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="auth-input-field"
            >
              <option value="all">全ての権限</option>
              <option value="user">一般ユーザー</option>
              <option value="admin">管理者</option>
              <option value="superAdmin">スーパー管理者</option>
            </select>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const userRole = getUserRole(user._id);
          const isProcessingUser = isProcessing === user._id;
          
          return (
            <div key={user._id} className="amano-bg-card rounded-xl p-6 amano-crystal-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">
                      {user.name || "名前未設定"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.email || "メールアドレス未設定"}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userRole === "superAdmin" 
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : userRole === "admin"
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                      }`}>
                        {userRole === "superAdmin" ? "スーパー管理者" : 
                         userRole === "admin" ? "管理者" : "一般ユーザー"}
                      </span>
                      <span className="text-xs text-gray-400">
                        登録日: {new Date(user._creationTime).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* アクション */}
                <div className="flex items-center space-x-2">
                  {currentUserRole === "superAdmin" && userRole === "user" && (
                    <>
                      <button
                        onClick={() => handleGrantAdmin(user._id, "admin")}
                        disabled={isProcessingUser}
                        className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50"
                      >
                        管理者に昇格
                      </button>
                      <button
                        onClick={() => handleGrantAdmin(user._id, "superAdmin")}
                        disabled={isProcessingUser}
                        className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 disabled:opacity-50"
                      >
                        スーパー管理者に昇格
                      </button>
                    </>
                  )}
                  
                  {currentUserRole === "superAdmin" && (userRole === "admin" || userRole === "superAdmin") && user._id !== currentUserRole && (
                    <button
                      onClick={() => handleRevokeAdmin(user._id)}
                      disabled={isProcessingUser}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm hover:from-red-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50"
                    >
                      権限削除
                    </button>
                  )}

                  {currentUserRole === "superAdmin" && (
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={isProcessingUser}
                      className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg text-sm hover:from-red-800 hover:to-red-600 transition-all duration-300 disabled:opacity-50"
                    >
                      {isProcessingUser ? "処理中..." : "削除"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 amano-bg-glass rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterRole !== "all" 
                ? "条件に一致するユーザーが見つかりません" 
                : "ユーザーが登録されていません"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminsList = () => (
    <div className="space-y-6">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          🛡️ 管理者一覧
        </h3>
        
        {adminList.length > 0 ? (
          <div className="space-y-4">
            {adminList.map((admin) => (
              <div key={admin._id} className="amano-bg-glass rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {admin.user?.name?.charAt(0) || admin.user?.email?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-200">
                        {admin.user?.name || "名前未設定"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {admin.user?.email || "メールアドレス未設定"}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.role === "superAdmin" 
                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                            : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                        }`}>
                          {admin.role === "superAdmin" ? "スーパー管理者" : "管理者"}
                        </span>
                        <span className="text-xs text-gray-400">
                          付与日: {new Date(admin.grantedAt).toLocaleDateString("ja-JP")}
                        </span>
                        {admin.grantedByUser && (
                          <span className="text-xs text-gray-400">
                            付与者: {admin.grantedByUser.name || admin.grantedByUser.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentUserRole === "superAdmin" && admin.userId !== currentUserRole && (
                    <button
                      onClick={() => handleRevokeAdmin(admin.userId)}
                      disabled={isProcessing === admin.userId}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm hover:from-red-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50"
                    >
                      {isProcessing === admin.userId ? "処理中..." : "権限削除"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-gray-300">管理者が登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "users":
        return renderUsersList();
      case "admins":
        return renderAdminsList();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          👤 ユーザー管理
        </h2>
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
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}
