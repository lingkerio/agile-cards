import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, type capConnectionOptions } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// 定义分组和卡片的类型
interface Group {
  group_id?: number; // 可选，因为插入时可能未定义
  group_name: string;
}

interface Card {
  card_id?: number; // 可选，因为插入时可能未定义
  group_id: number;
  question: string;
  answer: string;
  created_at: number;
  last_reviewed_at: number;
}

const sqlite = new SQLiteConnection(CapacitorSQLite);

const databaseService = {
  db: null as SQLiteDBConnection | null, // 数据库连接对象

  async init(): Promise<void> {
    try {
      // 如果数据库已初始化且连接已打开，则不执行任何操作
      if (this.db && (await this.db.isDBOpen()).result) {
        // console.log('数据库服务已初始化并打开');
        return;
      }

      // console.log('正在初始化数据库服务...');
      
      // 检查平台
      const platform = Capacitor.getPlatform();
      // console.log(`当前平台: ${platform}`);
      
      // 只在本地平台上初始化SQLite
      if (platform === 'web') {
        // console.log('Web平台不支持完整的SQLite功能，跳过初始化');
        return;
      }
      
      // 非Web平台初始化SQLite
      // console.log('正在设置数据库连接...');
      
      // 强制关闭任何可能存在的同名连接，以防万一
      try {
        await CapacitorSQLite.closeConnection({ database: 'knowledgeCardsDB' });
        // console.log('强制关闭knowledgeCardsDB的现有连接');
      } catch (e) {
        // console.log('无需关闭knowledgeCardsDB的现有连接或关闭失败:', e);
      }

      const db = await sqlite.createConnection('knowledgeCardsDB', false, 'no-encryption', 1, false);
      await db.open();

      // 确保卡片和分组表的存在
      await db.execute(`
        CREATE TABLE IF NOT EXISTS groups (
          group_id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_name TEXT
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS cards (
          card_id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER,
          question TEXT,
          answer TEXT,
          created_at INTEGER,
          last_reviewed_at INTEGER,
          FOREIGN KEY(group_id) REFERENCES groups(group_id)
        );
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_group_id ON cards(group_id);
      `);

      this.db = db;
      // console.log('数据库服务初始化成功.');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  },

  // 保存分组
  async saveGroup(group: Group): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      INSERT INTO groups (group_name) VALUES (?);
    `, [group.group_name]);
    return { changes: result.changes?.changes || 0 };
  },

  // 保存卡片
  async saveCard(card: Card): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      INSERT INTO cards (group_id, question, answer, created_at, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?);
    `, [card.group_id, card.question, card.answer, card.created_at, card.last_reviewed_at]);
    return { changes: result.changes?.changes || 0 };
  },

  // 获取所有分组
  async getGroups(): Promise<Group[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query('SELECT * FROM groups;');
    return result.values as Group[];
  },

  // 获取所有卡片
  async getCards(): Promise<Card[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query('SELECT * FROM cards;');
    return result.values as Card[];
  },

  // 获取每个分组及其对应的卡片
  async getGroupsWithCards(): Promise<{ group_id: number; group_name: string; cards: Card[] }[]> {
    if (!this.db) throw new Error('Database not initialized');
    const groups = await this.getGroups();
    const groupsWithCards = [];

    // 获取每个分组的卡片
    for (const group of groups) {
      const cards = await this.db.query(`
        SELECT * FROM cards WHERE group_id = ?;
      `, [group.group_id]);
      groupsWithCards.push({
        group_id: group.group_id!,
        group_name: group.group_name,
        cards: cards.values as Card[],
      });
    }

    return groupsWithCards;
  },

  // 获取指定分组的卡片
  async getCardsByGroupId(group_id: number): Promise<Card[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(`
      SELECT * FROM cards WHERE group_id = ?;
    `, [group_id]);
    return result.values as Card[];
  },

  // 更新卡片上次复习时间
  async updateCardLastReviewed(card_id: number, last_reviewed_at: number): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      UPDATE cards SET last_reviewed_at = ? WHERE card_id = ?;
    `, [last_reviewed_at, card_id]);
    return { changes: result.changes?.changes || 0 };
  },

  // 更新卡片内容
  async updateCard(card_id: number, question: string, answer: string): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      UPDATE cards SET question = ?, answer = ? WHERE card_id = ?;
    `, [question, answer, card_id]);
    return { changes: result.changes?.changes || 0 };
  },

  // 更新卡片分组
  async updateCardGroup(card_id: number, group_id: number): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      UPDATE cards SET group_id = ? WHERE card_id = ?;
    `, [group_id, card_id]);
    return { changes: result.changes?.changes || 0 };
  },

  // 更新分组名称
  async updateGroupName(group_id: number, group_name: string): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      UPDATE groups SET group_name = ? WHERE group_id = ?;
    `, [group_name, group_id]);
    return { changes: result.changes?.changes || 0 };
  },

  // 删除分组
  async deleteGroup(group_id: number): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      DELETE FROM groups WHERE group_id = ?;
    `, [group_id]);
    return { changes: result.changes?.changes || 0 };
  },

  // 删除卡片
  async deleteCard(card_id: number): Promise<{ changes: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(`
      DELETE FROM cards WHERE card_id = ?;
    `, [card_id]);
    return { changes: result.changes?.changes || 0 };
  },
};

export default databaseService;
