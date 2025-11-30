import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const userStats = useQuery(api.admin.getUserStats);

  if (!userStats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          👤 ユーザー管理
        </h2>
      </div>

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
          {Object.entries(userStats.ageGroups).map(([ageGroup, count]) => (
            <div key={ageGroup} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{ageGroup}</span>
              <span className="text-yellow-400 font-bold">{count}人</span>
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
          {Object.entries(userStats.genders).map(([gender, count]) => (
            <div key={gender} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{gender}</span>
              <span className="text-purple-400 font-bold">{count}人</span>
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
          {Object.entries(userStats.regions).map(([region, count]) => (
            <div key={region} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
              <span className="text-gray-200">{region}</span>
              <span className="text-cyan-400 font-bold">{count}人</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
