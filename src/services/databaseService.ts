import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export class SqliteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'jiji';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  // 初始化数据库
  async initDB(): Promise<void> {
    try {
      this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      await this.db.open();
      // 示例：创建一张表
      const createTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT
        );
      `;
      await this.db.execute(createTable);
    } catch (err) {
      console.error('DB init error:', err);
    }
  }

  // 插入数据
  async addUser(name: string, email: string): Promise<void> {
    if (!this.db) return;
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    await this.db.run(sql, [name, email]);
  }

  // 查询数据
  async getUsers(): Promise<any[]> {
    if (!this.db) return [];
    const sql = 'SELECT * FROM users';
    const res = await this.db.query(sql);
    return res.values ?? [];
  }

  // 关闭数据库
  async closeDB(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
    }
  }
}
