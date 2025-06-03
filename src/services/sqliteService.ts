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
        console.log('Database has not been initialized and opened.');
        try {
          await CapacitorSQLite.closeConnection({ database: this.dbName });
          console.log('Forced closing connection with knowledgeCards.');
        } catch (error) {
          console.log('No need or fail to close connection with knowledgeCards.', error);
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

        await db.execute(createGroup);
        await db.execute(createCards);

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
      console.log('Database has been initialized and opened.');
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
    `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", Date.now(), Date.now()]);
    return { changes: result.changes?.changes || 0 };
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
    `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", cards.last_review ?? Date.now(), cards.next_review ?? Date.now(), cards.card_id ?? 0]);
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

  // Generate card hash
  async cardHash(question: string, answer: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(question + answer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // 关闭数据库
  async closeDB(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
    }
  }
}
