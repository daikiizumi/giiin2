import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function UserManagement() {
  const users = useQuery(api.admin.listUsers);
  const adminUsers = useQuery(api.admin.listUsers);
  const grantAdmin = useMutation(api.admin.changeUserRole);
  const revokeAdmin = useMutation(api.admin.changeUserRole);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "user" | "admin" | "superAdmin">("all");

  const handleGrantAdmin = async (userId: Id<"users">) => {
    if (confirm("このユーザーに管理者権限を付与しますか？")) {
      try {
        await grantAdmin({ userId, role: "admin" });
      } catch (error) {
        console.error("Failed to grant admin:", error);
      }
    }
  };

  const handleRevokeAdmin = async (userId: Id<"users">) => {
    if (confirm("このユーザーの管理者権限を取り消しますか？")) {
      try {
        await revokeAdmin({ userId, role: "user" });
      } catch (error) {
        console.error("Failed to revoke admin:", error);
      }
    }
  };

  const getUserRole = (userId: Id<"users">) => {
    const user = users?.find((u: any) => u._id === userId);
    return user?.role || "user";
  };

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = getUserRole(user._id);
    const matchesRole = filterRole === "all" || userRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (!users || !adminUsers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 animate-amano-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-yellow-400 flex items-center space-x-2 amano-text-glow">
          <span>👑</span>
          <span>ユーザー管理</span>
        </h2>
        <p className="text-gray-300 text-sm mt-1">
          ユーザーの権限管理（運営者のみ）
        </p>
      </div>

      {/* Filters */}
      <div className="amano-bg-glass rounded-xl p-4 space-y-4 amano-crystal-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="ユーザー名、メールアドレスで検索..."
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
              <option value="admin">編集者</option>
              <option value="superAdmin">運営者</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="amano-bg-glass rounded-xl overflow-hidden amano-crystal-border">
        {filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">ユーザー</th>
                  <th className="px-6 py-4 text-left font-medium hidden sm:table-cell">メールアドレス</th>
                  <th className="px-6 py-4 text-left font-medium">権限</th>
                  <th className="px-6 py-4 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500">
                {filteredUsers.map((user: any, index: number) => {
                  const userRole = getUserRole(user._id);
                  return (
                    <tr 
                      key={user._id} 
                      className={`hover:bg-gradient-to-r hover:from-purple-900/20 hover:to-blue-900/20 transition-all duration-300 ${
                        index % 2 === 0 ? "amano-bg-card" : "bg-transparent"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user.name ? user.name.charAt(0) : user.email?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-200">
                              {user.name || "名前未設定"}
                            </div>
                            <div className="text-sm text-gray-400 sm:hidden">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 hidden sm:table-cell">
                        {user.email || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          userRole === "superAdmin" 
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" 
                            : userRole === "admin"
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                            : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                        }`}>
                          {userRole === "superAdmin" ? "運営者" : 
                           userRole === "admin" ? "編集者" : "一般ユーザー"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {userRole === "user" ? (
                            <button
                              onClick={() => handleGrantAdmin(user._id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded text-sm hover:from-emerald-500 hover:to-green-500 transition-all duration-300 transform hover:scale-105"
                            >
                              編集者に昇格
                            </button>
                          ) : userRole === "admin" ? (
                            <button
                              onClick={() => handleRevokeAdmin(user._id)}
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105"
                            >
                              権限を取り消し
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">変更不可</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterRole !== "all" ? "条件に一致するユーザーが見つかりません" : "ユーザーが登録されていません"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
