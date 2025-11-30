import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// メニュー設定を取得
export const getMenuSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("menuSettings").collect();
    
    // デフォルト設定（初回起動時）
    if (settings.length === 0) {
      return [
        { menuKey: "questions", menuName: "質問・回答", isVisible: true, order: 1 },
        { menuKey: "members", menuName: "議員一覧", isVisible: true, order: 2 },
        { menuKey: "rankings", menuName: "統計", isVisible: true, order: 3 },
        { menuKey: "news", menuName: "お知らせ", isVisible: true, order: 4 },
        { menuKey: "externalArticles", menuName: "議員ブログ・SNS", isVisible: false, order: 5 },
        { menuKey: "faq", menuName: "よくある質問", isVisible: true, order: 6 },
        { menuKey: "contact", menuName: "お問い合わせ", isVisible: true, order: 7 },
      ];
    }
    
    return settings.sort((a, b) => a.order - b.order);
  },
});

// 表示されているメニューのみを取得
export const getVisibleMenus = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("menuSettings")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
    
    // デフォルト設定（初回起動時）
    if (settings.length === 0) {
      return [
        { menuKey: "questions", menuName: "質問・回答", isVisible: true, order: 1 },
        { menuKey: "members", menuName: "議員一覧", isVisible: true, order: 2 },
        { menuKey: "rankings", menuName: "統計", isVisible: true, order: 3 },
        { menuKey: "news", menuName: "お知らせ", isVisible: true, order: 4 },
        { menuKey: "faq", menuName: "よくある質問", isVisible: true, order: 6 },
        { menuKey: "contact", menuName: "お問い合わせ", isVisible: true, order: 7 },
      ];
    }
    
    return settings.sort((a, b) => a.order - b.order);
  },
});

// メニュー設定を初期化
export const initializeMenuSettings = mutation({
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

    // 既存の設定があるかチェック
    const existingSettings = await ctx.db.query("menuSettings").collect();
    if (existingSettings.length > 0) {
      return; // 既に設定がある場合は何もしない
    }

    // デフォルト設定を作成
    const defaultMenus = [
      { menuKey: "questions", menuName: "質問・回答", isVisible: true, order: 1, description: "議会質問と回答を閲覧できます" },
      { menuKey: "members", menuName: "議員一覧", isVisible: true, order: 2, description: "市議会議員の一覧と詳細情報" },
      { menuKey: "rankings", menuName: "統計", isVisible: true, order: 3, description: "議員の活動統計" },
      { menuKey: "news", menuName: "お知らせ", isVisible: true, order: 4, description: "サイトからのお知らせ" },
      { menuKey: "externalArticles", menuName: "議員ブログ・SNS", isVisible: false, order: 5, description: "議員のブログやSNS投稿" },
      { menuKey: "faq", menuName: "よくある質問", isVisible: true, order: 6, description: "よくある質問と回答" },
      { menuKey: "contact", menuName: "お問い合わせ", isVisible: true, order: 7, description: "お問い合わせフォーム" },
    ];

    for (const menu of defaultMenus) {
      await ctx.db.insert("menuSettings", {
        ...menu,
        updatedBy: userId,
        updatedAt: Date.now(),
      });
    }
  },
});

// メニュー設定を更新
export const updateMenuSetting = mutation({
  args: {
    menuKey: v.string(),
    isVisible: v.optional(v.boolean()),
    order: v.optional(v.number()),
    menuName: v.optional(v.string()),
    description: v.optional(v.string()),
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

    // 既存の設定を取得
    const existingSetting = await ctx.db
      .query("menuSettings")
      .withIndex("by_menu_key", (q) => q.eq("menuKey", args.menuKey))
      .first();

    const updateData = {
      updatedBy: userId,
      updatedAt: Date.now(),
      ...(args.isVisible !== undefined && { isVisible: args.isVisible }),
      ...(args.order !== undefined && { order: args.order }),
      ...(args.menuName !== undefined && { menuName: args.menuName }),
      ...(args.description !== undefined && { description: args.description }),
    };

    if (existingSetting) {
      // 既存の設定を更新
      await ctx.db.patch(existingSetting._id, updateData);
    } else {
      // 新しい設定を作成
      await ctx.db.insert("menuSettings", {
        menuKey: args.menuKey,
        menuName: args.menuName || args.menuKey,
        isVisible: args.isVisible ?? true,
        order: args.order ?? 999,
        description: args.description,
        updatedBy: userId,
        updatedAt: Date.now(),
      });
    }
  },
});

// 複数のメニュー設定を一括更新
export const updateMultipleMenuSettings = mutation({
  args: {
    settings: v.array(v.object({
      menuKey: v.string(),
      isVisible: v.boolean(),
      order: v.number(),
      menuName: v.optional(v.string()),
      description: v.optional(v.string()),
    })),
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

    // 各設定を更新
    for (const setting of args.settings) {
      const existingSetting = await ctx.db
        .query("menuSettings")
        .withIndex("by_menu_key", (q) => q.eq("menuKey", setting.menuKey))
        .first();

      const updateData = {
        isVisible: setting.isVisible,
        order: setting.order,
        updatedBy: userId,
        updatedAt: Date.now(),
        ...(setting.menuName && { menuName: setting.menuName }),
        ...(setting.description && { description: setting.description }),
      };

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, updateData);
      } else {
        await ctx.db.insert("menuSettings", {
          menuKey: setting.menuKey,
          menuName: setting.menuName || setting.menuKey,
          ...updateData,
        });
      }
    }
  },
});
