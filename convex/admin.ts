import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// 管理者権限チェック
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!adminUser;
  },
});

// スーパー管理者権限チェック
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return adminUser?.role === "superAdmin";
  },
});

// ユーザーの役割を取得
export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return "guest";
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      return "user";
    }

    return adminUser.role;
  },
});

// 管理者を追加（スーパー管理者のみ）
export const addAdmin = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("superAdmin")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentAdmin || currentAdmin.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 既に管理者かチェック
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingAdmin) {
      throw new Error("既に管理者です");
    }

    return await ctx.db.insert("adminUsers", {
      userId: args.userId,
      role: args.role,
      grantedBy: currentUserId,
      grantedAt: Date.now(),
    });
  },
});

// 管理者を削除（スーパー管理者のみ）
export const removeAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentAdmin || currentAdmin.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 自分自身は削除できない
    if (args.userId === currentUserId) {
      throw new Error("自分自身の管理者権限は削除できません");
    }

    const adminToRemove = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!adminToRemove) {
      throw new Error("管理者が見つかりません");
    }

    await ctx.db.delete(adminToRemove._id);
  },
});

// 管理者一覧を取得
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      return [];
    }

    const admins = await ctx.db.query("adminUsers").collect();
    
    // ユーザー情報を含めて返す
    const adminsWithUsers = await Promise.all(
      admins.map(async (admin) => {
        const user = await ctx.db.get(admin.userId);
        const grantedByUser = await ctx.db.get(admin.grantedBy);
        return {
          ...admin,
          user,
          grantedByUser,
        };
      })
    );

    return adminsWithUsers;
  },
});

// 全ユーザー一覧を取得（管理者のみ）
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    return await ctx.db.query("users").collect();
  },
});

// ユーザーを削除（スーパー管理者のみ）
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentAdmin || currentAdmin.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 自分自身は削除できない
    if (args.userId === currentUserId) {
      throw new Error("自分自身のアカウントは削除できません");
    }

    // ユーザーが存在するかチェック
    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) {
      throw new Error("ユーザーが見つかりません");
    }

    // 関連データを削除
    // 1. 管理者権限があれば削除
    const adminRecord = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (adminRecord) {
      await ctx.db.delete(adminRecord._id);
    }

    // 2. ユーザー属性情報を削除
    const demographics = await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (demographics) {
      await ctx.db.delete(demographics._id);
    }

    // 3. いいね情報を削除
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 4. メール認証関連データを削除
    const emailStatus = await ctx.db
      .query("userEmailStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const status of emailStatus) {
      await ctx.db.delete(status._id);
    }

    // 5. メール認証トークンを削除（ユーザーのメールアドレスに関連するもの）
    if (userToDelete.email) {
      const emailTokens = await ctx.db
        .query("emailVerificationTokens")
        .filter((q) => q.eq(q.field("email"), userToDelete.email))
        .collect();
      for (const token of emailTokens) {
        await ctx.db.delete(token._id);
      }
    }

    // 6. 最後にユーザーアカウントを削除
    await ctx.db.delete(args.userId);
  },
});

// 手動クリーンアップ：メールアドレスに関連する全データを削除
export const manualCleanupByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentAdmin || currentAdmin.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    let deletedCount = 0;
    const deletedItems: string[] = [];

    // 1. 該当するユーザーを検索
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // 現在のユーザー自身は削除しない
      if (user._id === currentUserId) {
        throw new Error("自分自身のアカウントは削除できません");
      }

      // ユーザーに関連するデータを削除
      const adminRecord = await ctx.db
        .query("adminUsers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (adminRecord) {
        await ctx.db.delete(adminRecord._id);
        deletedCount++;
        deletedItems.push("管理者権限");
      }

      const demographics = await ctx.db
        .query("userDemographics")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (demographics) {
        await ctx.db.delete(demographics._id);
        deletedCount++;
        deletedItems.push("ユーザー属性情報");
      }

      const likes = await ctx.db
        .query("likes")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const like of likes) {
        await ctx.db.delete(like._id);
        deletedCount++;
      }
      if (likes.length > 0) {
        deletedItems.push(`いいね情報 (${likes.length}件)`);
      }

      const emailStatus = await ctx.db
        .query("userEmailStatus")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const status of emailStatus) {
        await ctx.db.delete(status._id);
        deletedCount++;
      }
      if (emailStatus.length > 0) {
        deletedItems.push(`メール認証状態 (${emailStatus.length}件)`);
      }

      // ユーザーアカウントを削除
      await ctx.db.delete(user._id);
      deletedCount++;
      deletedItems.push("ユーザーアカウント");
    }

    // 2. メールアドレスに関連する認証トークンを削除（ユーザーが存在しない場合も含む）
    const emailTokens = await ctx.db
      .query("emailVerificationTokens")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    for (const token of emailTokens) {
      await ctx.db.delete(token._id);
      deletedCount++;
    }
    if (emailTokens.length > 0) {
      deletedItems.push(`認証トークン (${emailTokens.length}件)`);
    }

    // 3. メールアドレスに関連するメール認証状態を削除（ユーザーが存在しない場合も含む）
    const orphanedEmailStatus = await ctx.db
      .query("userEmailStatus")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    for (const status of orphanedEmailStatus) {
      await ctx.db.delete(status._id);
      deletedCount++;
    }
    if (orphanedEmailStatus.length > 0) {
      deletedItems.push(`孤立したメール認証状態 (${orphanedEmailStatus.length}件)`);
    }

    // 4. 古いauthAccountsを削除（重要：これが重複エラーの主な原因）
    try {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      const orphanedAuthAccounts = authAccounts.filter(account => 
        account.provider === "password" && 
        (account.providerAccountId === args.email ||
         (account.providerAccountId && account.providerAccountId.includes(args.email)))
      );

      for (const account of orphanedAuthAccounts) {
        await ctx.db.delete(account._id);
        deletedCount++;
      }
      if (orphanedAuthAccounts.length > 0) {
        deletedItems.push(`認証アカウント (${orphanedAuthAccounts.length}件)`);
      }
    } catch (error) {
      console.error("Failed to cleanup auth accounts:", error);
    }

    return {
      success: true,
      deletedCount,
      deletedItems,
      email: args.email,
    };
  },
});

// クリーンアップ対象データの検索
export const searchCleanupTargets = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const targets: Array<{
      type: string;
      count: number;
      details: string;
    }> = [];

    // 1. ユーザーアカウント
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      targets.push({
        type: "ユーザーアカウント",
        count: 1,
        details: `ID: ${user._id}, 名前: ${user.name || "未設定"}`,
      });

      // 関連データをチェック
      const adminRecord = await ctx.db
        .query("adminUsers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (adminRecord) {
        targets.push({
          type: "管理者権限",
          count: 1,
          details: `役割: ${adminRecord.role}`,
        });
      }

      const demographics = await ctx.db
        .query("userDemographics")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (demographics) {
        targets.push({
          type: "ユーザー属性情報",
          count: 1,
          details: `年代: ${demographics.ageGroup}, 性別: ${demographics.gender}`,
        });
      }

      const likes = await ctx.db
        .query("likes")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      if (likes.length > 0) {
        targets.push({
          type: "いいね情報",
          count: likes.length,
          details: `${likes.length}件のいいね`,
        });
      }

      const emailStatus = await ctx.db
        .query("userEmailStatus")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      if (emailStatus.length > 0) {
        targets.push({
          type: "メール認証状態",
          count: emailStatus.length,
          details: `${emailStatus.length}件の認証状態`,
        });
      }
    }

    // 2. 認証トークン
    const emailTokens = await ctx.db
      .query("emailVerificationTokens")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    if (emailTokens.length > 0) {
      targets.push({
        type: "認証トークン",
        count: emailTokens.length,
        details: `${emailTokens.length}件のトークン`,
      });
    }

    // 3. 孤立したメール認証状態
    const orphanedEmailStatus = await ctx.db
      .query("userEmailStatus")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    if (orphanedEmailStatus.length > 0) {
      targets.push({
        type: "孤立したメール認証状態",
        count: orphanedEmailStatus.length,
        details: `${orphanedEmailStatus.length}件の孤立した状態`,
      });
    }

    // 4. 古いauthAccounts
    try {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      const orphanedAuthAccounts = authAccounts.filter(account => 
        account.provider === "password" && 
        (account.providerAccountId === args.email ||
         (account.providerAccountId && account.providerAccountId.includes(args.email)))
      );
      if (orphanedAuthAccounts.length > 0) {
        targets.push({
          type: "認証アカウント",
          count: orphanedAuthAccounts.length,
          details: `${orphanedAuthAccounts.length}件の認証アカウント`,
        });
      }
    } catch (error) {
      console.error("Failed to search auth accounts:", error);
    }

    return {
      email: args.email,
      targets,
      totalCount: targets.reduce((sum, target) => sum + target.count, 0),
    };
  },
});

// システム統計を取得
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const members = await ctx.db.query("councilMembers").collect();
    const questions = await ctx.db.query("questions").collect();
    const users = await ctx.db.query("users").collect();
    const news = await ctx.db.query("news").collect();
    const recentQuestions = await ctx.db
      .query("questions")
      .order("desc")
      .take(5);

    return {
      memberCount: members.length,
      questionCount: questions.length,
      userCount: users.length,
      newsCount: news.length,
      recentQuestions,
    };
  },
});

// ユーザー統計を取得
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const users = await ctx.db.query("users").collect();
    const demographics = await ctx.db.query("userDemographics").collect();

    // 年代別統計 - 配列形式に変換してConvexの制限を回避
    const ageGroupsRaw = demographics.reduce((acc, demo) => {
      acc[demo.ageGroup] = (acc[demo.ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const ageGroups = Object.entries(ageGroupsRaw).map(([key, value]) => ({
      label: key,
      count: value
    }));

    // 性別統計 - 配列形式に変換してConvexの制限を回避
    const gendersRaw = demographics.reduce((acc, demo) => {
      acc[demo.gender] = (acc[demo.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const genders = Object.entries(gendersRaw).map(([key, value]) => ({
      label: key,
      count: value
    }));

    // 地域統計 - 配列形式に変換してConvexの制限を回避
    const regionsRaw = demographics.reduce((acc, demo) => {
      acc[demo.region] = (acc[demo.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const regions = Object.entries(regionsRaw).map(([key, value]) => ({
      label: key,
      count: value
    }));

    return {
      totalUsers: users.length,
      totalDemographics: demographics.length,
      ageGroups,
      genders,
      regions,
    };
  },
});
