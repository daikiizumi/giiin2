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

    // 年代別統計
    const ageGroups = demographics.reduce((acc, demo) => {
      acc[demo.ageGroup] = (acc[demo.ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 性別統計
    const genders = demographics.reduce((acc, demo) => {
      acc[demo.gender] = (acc[demo.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 地域統計
    const regions = demographics.reduce((acc, demo) => {
      acc[demo.region] = (acc[demo.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: users.length,
      totalDemographics: demographics.length,
      ageGroups,
      genders,
      regions,
    };
  },
});
