import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface Group {
  group_id?:  number;
  group_name: string;
  group_dis?: string;
}

export interface Cards {
  card_id?:     number;
  card_hash?:   string;
  group_id:     number;
  question:     string;
  answer?:      string;
  last_review?: number;
  next_review?: number;
}

export interface Record {
  record_id: number;
  avg_score: number;
}

export interface DavConfig {
  address:  string;
  username: string;
  password: string;
}

export interface LLMConfig {
  address: string;
  token:   string;
}

export class SqliteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'knowledgeCards';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  // Initialize Database
  async initDB(): Promise<void> {
    try {
      if (this.db && (await this.db.isDBOpen()).result) {
        // Database opened.
      } else {
        // console.log('Database has not been initialized and opened.');
        try {
          await CapacitorSQLite.closeConnection({ database: this.dbName });
          // console.log('Forced closing connection with knowledgeCards.');
        } catch (error) {
          // console.log('No need or fail to close connection with knowledgeCards.', error);
        }
        const db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
        await db.open();

        const createGroup = `
          CREATE TABLE IF NOT EXISTS \`Group\` (
            group_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            group_name TEXT    NOT NULL    UNIQUE,
            group_dis  TEXT    NOT NULL
          );
        `;

        const createCards = `
          CREATE TABLE IF NOT EXISTS \`Cards\` (
            card_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            card_hash   TEXT    NOT NULL    UNIQUE,
            group_id    INTEGER NOT NULL,
            question    TEXT    NOT NULL,
            answer      TEXT    NOT NULL,
            last_review INTEGER NOT NULL,
            next_review INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES \`Group\` (group_id)
          );
        `;

        const createRecord = `
          CREATE TABLE IF NOT EXISTS \`Record\` (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            avg_score REAL
          );
        `;

        const createDavCof = `
          CREATE TABLE IF NOT EXISTS \`DavCof\` (
            address  TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL UNIQUE
          );
        `;

        const createLLMCof = `
          CREATE TABLE IF NOT EXISTS \`LLMCof\` (
            address TEXT NOT NULL UNIQUE,
            token   TEXT NOT NULL UNIQUE
          );
        `;

        await db.execute(createGroup);
        await db.execute(createCards);
        await db.execute(createRecord);
        await db.execute(createDavCof);
        await db.execute(createLLMCof);

        const result = await db.query(`
          SELECT group_name FROM \`Group\` WHERE group_name = ?;
        `, ['默认']);
        if (!result.values || result.values.length === 0) {
          await db.run(`
            INSERT INTO \`Group\` (group_name, group_dis) VALUES (?, ?);
          `, ['默认', '默认卡片组']);
        }

        this.db = db;
      }
      // console.log('Database has been initialized and opened.');
    } catch (err) {
      console.error('Database initialize error:', err);
    }
  }

  // Save group
  async saveGroup(group: Group): Promise<{ changes: number }> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    if (await this.getGroupNum() < 16) {
      const result = await this.db.run(`
        INSERT INTO \`Group\` (group_name, group_dis) VALUES (?, ?);
      `, [group.group_name, group.group_dis ?? '']);
      return { changes: result.changes?.changes || 0 };
    } else {
      return { changes: 0 };
    }
  }

  // Save cards
  async saveCards(cards: Cards): Promise<{ changes: number }> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.run(`
      INSERT INTO \`Cards\` (card_hash, group_id, question, answer, last_review, next_review) VALUES (?, ?, ?, ?, ?, ?);
      `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", Date.now(), Date.now() + 86400000]); // ! 正确逻辑
      // `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", Date.now(), Date.now()]); // # 测试逻辑
    return { changes: result.changes?.changes || 0 };
  }

  // Save record
  async saveRecord(record: number): Promise<{ changes: number }> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.run(`
      INSERT INTO \`Record\` (avg_score) VALUES (?);
    `, [record]);
    return { changes: result.changes?.changes || 0 };
  }

  // Save WebDav Config
  async saveDavConfig(conf: DavConfig): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(`
      DELETE FROM \`DavCof\`;
    `);
    await this.db.run(`
      INSERT INTO \`DavCof\` (address, username, password) VALUES (?, ?, ?);
    `, [conf.address, conf.username, conf.password]);
  }

  // Save LLM Config
  async saveLLMConfig(conf: LLMConfig): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(`
      DELETE FROM \`LLMCof\`;
    `);
    await this.db.run(`
      INSERT INTO \`LLMCof\` (address, token) VALUES (?, ?);
    `, [conf.address, conf.token]);
  }

  // Get group
  async getGroup(): Promise<Group[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT * FROM \`Group\`;`);
    return result.values as Group[];
  }

  // Get cards
  async getCards(): Promise<Cards[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT * FROM \`Cards\`;`);
    return result.values as Cards[];
  }

  // Get record
  async getRecord(): Promise<Record[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      SELECT record_id, avg_score FROM \`Record\`
      ORDER BY record_id DESC LIMIT 7;
    `);
    return result.values as Record[];
  }

  // Get review cards
  async getReviewCards(): Promise<Cards[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      SELECT * FROM \`Cards\` WHERE next_review < ?
    `, [Date.now()]);
    return result.values as Cards[];
  }

  // Get group by id
  async getGroupByID(id: number): Promise<Group[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      SELECT * FROM \`Group\` WHERE group_id = ?;
    `, [id]);
    return result.values as Group[];
  }

  // Get cards by id
  async getCardsByID(id: number): Promise<Cards[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      SELECT * FROM \`Cards\` WHERE card_id = ?;
    `, [id]);
    return result.values as Cards[];
  }

  // Drop group by id
  async dropGroupByID(id: number): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    let result = await this.db.query(`
      DELETE FROM \`Cards\` WHERE group_id = ?;
    `, [id]);
    result = await this.db.query(`
      DELETE FROM \`Group\` WHERE group_id = ? AND group_name <> ?;
    `, [id, '默认']);
    return result.values?.[0];
  }

  // Drop cards by id
  async dropCardsByID(id: number): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      DELETE FROM \`Cards\` WHERE card_id = ?;
    `, [id]);
    return result.values?.[0];
  }

  // Update group of id
  async updateGroupOfID(group: Group): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      UPDATE \`Group\` SET group_name = ?, group_dis = ?
      WHERE group_id = ? AND group_name != ?;
    `, [group.group_name, group.group_dis ?? "", group.group_id, '默认']);
    return result.values?.[0];
  }

  // Update cards of id
  async updateCardsOfID(cards: Cards): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`
      UPDATE \`Cards\` SET card_hash = ?, group_id = ?, question = ?, answer = ?, last_review = ?, next_review = ?
      WHERE card_id = ?;
    `, [
      await this.cardHash(cards.question, cards.answer ?? ""), 
      cards.group_id, 
      cards.question, 
      cards.answer ?? "", 
      cards.last_review ?? Date.now(), 
      cards.next_review ?? (Date.now() + 86400000), 
      cards.card_id ?? 0
    ]); // ! 正确逻辑
    //   await this.cardHash(cards.question, cards.answer ?? ""), 
    //   cards.group_id, 
    //   cards.question, 
    //   cards.answer ?? "", 
    //   cards.last_review ?? Date.now(), 
    //   cards.next_review ?? Date.now(), 
    //   cards.card_id ?? 0
    // ]); // # 测试逻辑
    return result.values?.[0];
  }

  // Review cards of id
  async reviewCards(card_id: number, score: number): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const info = await this.db.query(`
      SELECT last_review, next_review FROM \`Cards\` WHERE card_id = ?;
    `, [card_id]);
    // console.log('reviewCards function', info);
    const time = (Date.now() - info.values?.[0]?.["last_review"]) * score;
    // console.log('Next gap time', time);
    const result = await this.db.query(`
      UPDATE \`Cards\` SET last_review = ?, next_review = ?
      WHERE card_id = ?;
      `, [Date.now(), Date.now() + time, card_id]); // ! 正确逻辑
      // `, [Date.now(), Date.now(), card_id]); // # 测试逻辑
    return result.values?.[0];
  }

  // Get group number
  async getGroupNum(): Promise<number> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT COUNT(*) FROM \`Group\`;`);
    return result.values?.[0]?.["COUNT(*)"] ?? 0;
  }

  // Get cards number
  async getCardsNum(): Promise<number> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT COUNT(*) FROM \`Cards\`;`);
    return result.values?.[0]?.["COUNT(*)"] ?? 0;
  }

  // Get WebDAV Config
  async getDavConfig(): Promise<DavConfig> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT * FROM \`DavCof\`;`);
    console.log('DAV Config:', result);
    return result.values?.[0] ?? { 
      address:  '',
      username: '',
      password: ''
    };
  }

  // Get LLM Config
  async getLLMConfig(): Promise<LLMConfig> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.query(`SELECT * FROM \`LLMCof\`;`);
    console.log('LLM Config:', result);
    return result.values?.[0] ?? {
      address: '',
      token:   ''
    }
  }

  // Generate card hash
  async cardHash(question: string, answer: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(question + answer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // --- Utility Function for Export ---
  /**
   * Escapes a value for safe inclusion in an SQL literal.
   * Handles strings, numbers, null, and undefined.
   * @param value The value to escape.
   * @returns SQL-safe string representation of the value.
   */
  private escapeSQLValue(value: any): string {
    if (value === null || typeof value === 'undefined') {
      return 'NULL';
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
          console.warn(`Attempting to export non-finite number: ${value}. Exporting as NULL.`);
          return 'NULL';
      }
      return value.toString();
    }
    if (typeof value === 'string') {
      // Replace single quotes with two single quotes
      return `'${value.replace(/'/g, "''")}'`;
    }
    console.warn(`Unsupported data type for SQL export: ${typeof value}. Exporting as NULL.`);
    return 'NULL';
  }

  // --- Export Function ---
  /**
   * Exports the entire database content as an SQL script string.
   * This script can be used to recreate the data in another compatible SQLite database
   * using the importFromSQL function (which relies on executeSet's transaction handling).
   * @returns A promise resolving with the SQL script string.
   */
  async exportToSQL(): Promise<string> {
    if (!this.db) await this.initDB(); // Ensure DB is ready
    if (!this.db) throw new Error('Database not initialized.');

    const sqlCommands: string[] = [];
    // REMOVED: sqlCommands.push('BEGIN TRANSACTION;'); // Let executeSet handle the transaction

    try {
      // 1. Export Groups
      const groups = await this.getGroup();
      if (groups.length > 0) {
        sqlCommands.push('-- Exporting Groups');
        groups.forEach(group => {
          sqlCommands.push(`INSERT OR IGNORE INTO \`Group\` (group_id, group_name, group_dis) VALUES (${this.escapeSQLValue(group.group_id)}, ${this.escapeSQLValue(group.group_name)}, ${this.escapeSQLValue(group.group_dis)});`);
        });
      }

      // 2. Export Cards
      const cards = await this.getCards();
      if (cards.length > 0) {
        sqlCommands.push('-- Exporting Cards');
        cards.forEach(card => {
          sqlCommands.push(`INSERT OR IGNORE INTO \`Cards\` (card_id, card_hash, group_id, question, answer, last_review, next_review) VALUES (${this.escapeSQLValue(card.card_id)}, ${this.escapeSQLValue(card.card_hash)}, ${this.escapeSQLValue(card.group_id)}, ${this.escapeSQLValue(card.question)}, ${this.escapeSQLValue(card.answer)}, ${this.escapeSQLValue(card.last_review)}, ${this.escapeSQLValue(card.next_review)});`);
        });
      }

      // 3. Export Records
      const records = await this.db.query(`
        SELECT record_id, avg_score FROM \`Record\`
        ORDER BY record_id DESC LIMIT 7;
      `);
      if (records.values && records.values.length > 0) {
        sqlCommands.push('-- Exporting Records');
        records.values.forEach((record: any) => {
          sqlCommands.push(`INSERT INTO \`Record\` (record_id, avg_score) VALUES (${this.escapeSQLValue(record.record_id)}, ${this.escapeSQLValue(record.avg_score)});`);
        });
      }

      // 4. Export DavCof
      const davCofs = await this.db.query(`
        SELECT address, username, password FROM \`DavCof\`;
      `);
      if (davCofs.values && davCofs.values.length > 0) {
        sqlCommands.push('-- Exporting DavCof');
        davCofs.values.forEach((dav: any) => {
          sqlCommands.push(`INSERT OR IGNORE INTO \`DavCof\` (address, username, password) VALUES (${this.escapeSQLValue(dav.address)}, ${this.escapeSQLValue(dav.username)}, ${this.escapeSQLValue(dav.password)});`);
        });
      }

      // 5. Export LLMCof
      const llmCofs = await this.db.query(`
        SELECT address, token FROM \`LLMCof\`;
      `);
      if (llmCofs.values && llmCofs.values.length > 0) {
        sqlCommands.push('-- Exporting LLMCof');
        llmCofs.values.forEach((llm: any) => {
          sqlCommands.push(`INSERT OR IGNORE INTO \`LLMCof\` (address, token) VALUES (${this.escapeSQLValue(llm.address)}, ${this.escapeSQLValue(llm.token)});`);
        });
      }

      // REMOVED: sqlCommands.push('COMMIT;'); // Let executeSet handle the transaction commit/rollback

      return sqlCommands.join('\n'); // Join commands with newline for readability

    } catch (error) {
      // REMOVED: sqlCommands.push('ROLLBACK;'); // executeSet handles rollback on error
      console.error('Error during database export:', error);
      throw new Error(`Failed to export database to SQL: ${error}`);
    }
  }


  /**
   * 解析 SQL 脚本并逐句执行
   * @param sqlScript SQL脚本字符串
   * @returns 执行变更数和消息
   */
  async importFromSQL(sqlScript: string): Promise<{ changes: number; message?: string }> {
    if (!this.db) await this.initDB();
    if (!this.db) {
      return { changes: -1, message: 'Import failed: Database not initialized.' };
    }

    let retMessage: string = '';

    try {
      // 清空数据
      await this.db.run('DELETE FROM `Record`;');
      await this.db.run('DELETE FROM `Cards`;');
      await this.db.run('DELETE FROM `Group`;');
      await this.db.run('DELETE FROM `DavCof`;');
      await this.db.run('DELETE FROM `LLMCof`;');

      // 解析 SQL 脚本为单条语句
      const statements = this.parseSQLStatements(sqlScript);

      let totalChanges = 0;
      for (const stmt of statements) {
        if (!stmt.trim()) continue; // 跳过空语句
        try {
          const res = await this.db.run(stmt);
          retMessage += stmt + '\n';
          // 某些实现可能没有 changes 字段
          if (typeof res.changes === 'number') totalChanges += res.changes;
        } catch (e) {
          // 可以选择直接抛出，也可以记录错误继续
          console.warn('SQL 语句执行失败:', stmt, e);
          throw new Error(`Failed to execute: ${stmt}\n${e}`);
        }
      }

      // 检查默认组
      const defaultGroupCheck = await this.db.query(
        `SELECT group_id FROM \`Group\` WHERE group_name = ?;`, ['默认']
      );
      if (!defaultGroupCheck.values || defaultGroupCheck.values.length === 0) {
        await this.db.run(
          `INSERT OR IGNORE INTO \`Group\` (group_name, group_dis) VALUES (?, ?);`,
          ['默认', '默认卡片组']
        );
      }

      return { changes: totalChanges, message: 'Import successful. Existing data was cleared before import.\nMessage:\n' + retMessage + '\n' };
    } catch (err: any) {
      return { changes: -1, message: `Import failed: ${err.message || err}` };
    }
  }

  /**
   * 将 SQL 脚本拆分为单条语句（简单处理，适合常规 INSERT/UPDATE/DELETE/CREATE）
   * 支持去除 -- 注释和多行语句
   */
  parseSQLStatements(sql: string): string[] {
    // 去掉 -- 注释行
    const lines = sql.split('\n').map(line => line.replace(/--.*$/, ''));
    const script = lines.join('\n');

    // 按分号拆分，但要避免分号在字符串内部
    const statements: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < script.length; i++) {
      const c = script[i];
      if (c === "'" && !inDouble) {
        inSingle = !inSingle;
        current += c;
      } else if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        current += c;
      } else if (c === ';' && !inSingle && !inDouble) {
        statements.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    if (current.trim()) statements.push(current.trim());
    // 过滤空语句
    return statements.filter(s => s.trim());
  }


  // DELETE data
  async deleteData(): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(`DELETE FROM \`Cards\`;`);
    await this.db.run(`DELETE FROM \`Group\`;`);
    await this.db.run(`DELETE FROM \`Record\`;`);
  }

  // DELETE config
  async deleteConf(): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(`DELETE FROM \`DavCof\`;`);
    await this.db.run(`DELETE FROM \`LLMCof\`;`);
  }

  // Close databse
  async closeDB(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
    }
  }
}
