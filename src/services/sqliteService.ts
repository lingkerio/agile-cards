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

        await db.execute(createGroup);
        await db.execute(createCards);
        await db.execute(createRecord);

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
    `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", Date.now(), Date.now()]); // # 测试逻辑
    // `, [await this.cardHash(cards.question, cards.answer ?? ""), cards.group_id, cards.question, cards.answer ?? "", Date.now(), Date.now() + 86400000]); // ! 正确逻辑
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
    //   await this.cardHash(cards.question, cards.answer ?? ""), 
    //   cards.group_id, 
    //   cards.question, 
    //   cards.answer ?? "", 
    //   cards.last_review ?? Date.now(), 
    //   cards.next_review ?? (Date.now() + 86400000), 
    //   cards.card_id ?? 0
    // ]); // ! 正确逻辑
      await this.cardHash(cards.question, cards.answer ?? ""), 
      cards.group_id, 
      cards.question, 
      cards.answer ?? "", 
      cards.last_review ?? Date.now(), 
      cards.next_review ?? Date.now(), 
      cards.card_id ?? 0
    ]); // # 测试逻辑
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
    `, [Date.now(), Date.now(), card_id]); // # 测试逻辑
    // `, [Date.now(), Date.now() + time, card_id]); // ! 正确逻辑
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
    await this.initDB(); // Ensure DB is ready
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
          // Including record_id for potential exact restoration.
          // Note: If importing into a table that already has data, this might cause
          // conflicts if the target table's auto-increment sequence isn't reset or handled.
          // Using INSERT OR IGNORE might be safer if exact ID preservation isn't critical
          // and duplicates based on primary key should be skipped.
          // For now, keeping INSERT as it matches the original export logic.
          sqlCommands.push(`INSERT INTO \`Record\` (record_id, avg_score) VALUES (${this.escapeSQLValue(record.record_id)}, ${this.escapeSQLValue(record.avg_score)});`);
        });
      }

      // REMOVED: sqlCommands.push('COMMIT;'); // Let executeSet handle the transaction commit/rollback

      return sqlCommands.join('\n'); // Join commands with newline for readability

    } catch (error) {
      // REMOVED: sqlCommands.push('ROLLBACK;'); // executeSet handles rollback on error
      console.error('Error during database export:', error);
      // Re-throw the error without adding ROLLBACK to the command list
      throw new Error(`Failed to export database to SQL: ${error}`);
    }
  }

  // --- Import Function ---
  /**
   * Imports data from an SQL script string into the database.
   * THIS VERSION CLEARS EXISTING DATA before importing.
   * Assumes the script contains valid SQLite INSERT statements (like those generated by exportToSQL).
   * WARNING: This operation is DESTRUCTIVE and will delete all existing groups, cards, and records
   * before importing the data from the script. User confirmation is highly recommended.
   * @param sqlScript The SQL script string to execute (should NOT contain BEGIN/COMMIT).
   * @returns A promise resolving with the number of changes made by the import script or -1 on failure.
   */
  async importFromSQL(sqlScript: string): Promise<{ changes: number; message?: string }> {
    await this.initDB(); // Ensure DB schema exists
    if (!this.db) {
      return { changes: -1, message: 'Import failed: Database not initialized.' };
    }

    try {
      // --- BEGINNING OF ADDED CLEARING LOGIC ---
      // console.warn('Attempting to clear existing data before import...');

      // Clear tables in reverse order of dependency or rely on CASCADE
      // Since Cards has ON DELETE CASCADE for group_id, deleting Groups will also delete associated Cards.
      // However, deleting Cards explicitly first is also safe and perhaps clearer.
      // Record table is independent.

      // It's often safer to wrap clearing and importing in a single transaction
      // although executeSet might handle its own transaction internally.
      // Let's try running DELETEs first. If they fail, import won't proceed.

      await this.db.run('DELETE FROM `Record`;');
      console.log('Cleared Record table.');
      await this.db.run('DELETE FROM `Cards`;'); // Clear cards first
      console.log('Cleared Cards table.');
      await this.db.run('DELETE FROM `Group`;'); // Then clear groups (cascade should handle cards if not deleted above)
      console.log('Cleared Group table.');

      // IMPORTANT: Re-insert the default group immediately after clearing,
      // OR ensure the import script *always* contains the default group.
      // The current export script includes it, so this should be okay.
      // If not, you'd add:
      // await this.db.run(`INSERT INTO \`Group\` (group_name, group_dis) VALUES (?, ?);`, ['默认', '默认卡片组']);

      console.log('Data cleared successfully. Proceeding with import...');
      // --- END OF ADDED CLEARING LOGIC ---

      // Now execute the import script using executeSet
      // executeSet should handle the transaction for the statements within sqlScript
      const result = await this.db.executeSet([{ statement: sqlScript, values: [] }]);
      const changes = result.changes?.changes ?? -1; // Use -1 to indicate potential issue if changes aren't reported

      // Check if the default group exists after import, if not, add it (extra safety)
      const defaultGroupCheck = await this.db.query(`SELECT group_id FROM \`Group\` WHERE group_name = ?;`, ['默认']);
        if (!defaultGroupCheck.values || defaultGroupCheck.values.length === 0) {
          console.warn("Default group missing after import, re-adding it.");
          await this.db.run(`INSERT OR IGNORE INTO \`Group\` (group_name, group_dis) VALUES (?, ?);`, ['默认', '默认卡片组']);
        }


      console.log(`SQL script imported successfully. Changes reported by script execution: ${changes}`);
      return { changes: changes, message: 'Import successful. Existing data was cleared before import.' };

    } catch (err: any) {
      console.error('Error during import process (clearing or executing script):', err);
      // Provide a more informative error return
      return { changes: -1, message: `Import failed: ${err.message || err}` };
    }
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
