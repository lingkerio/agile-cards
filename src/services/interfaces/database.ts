// src/interfaces/database.ts (或者你喜欢的任何路径)

export interface KnowledgeCard {
  id?: number; // 数据库自增ID，插入时可能没有
  question: string;
  answer: string;
  group_id: number | null; // 引用 KnowledgeCardGroup 的 ID，null 表示未分组
  last_reviewed_at: string | null; // DATETIME 格式的字符串
  next_review_at: string | null; // DATETIME 格式的字符串
  easiness_factor: number;
  repetitions: number;
  interval: number;
  status: 'new' | 'learning' | 'mastered'; // 只有这三种状态
  created_at?: string; // DATETIME 格式的字符串，通常由数据库自动填充
  updated_at?: string; // DATETIME 格式的字符串，通常由数据库自动填充
}

export interface KnowledgeCardGroup {
  id?: number; // 数据库自增ID，插入时可能没有
  title: string;
  subtitle: string | null;
  created_at?: string;
  updated_at?: string;
}

// 用户对卡片的评分
export type ReviewScore = 0 | 1 | 2 | 3 | 4 | 5;