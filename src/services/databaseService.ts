import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, type capTask } from '@capacitor-community/sqlite'
import type { KnowledgeCard, KnowledgeCardGroup, ReviewScore } from './interfaces/database'

export class SqliteService {
  private sqlite: SQLiteConnection
  private db: SQLiteDBConnection | null = null
  private dbName = 'agile_cards' // 数据库文件名

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  /**
   * 初始化数据库连接并创建表
   */
  public async initialize(): Promise<void> {
    try {
      // 检查连接是否已存在
      const ret = await this.sqlite.checkConnectionsConsistency()
      const isConn = ret.result ? await this.sqlite.isConnection(this.dbName, false) : false

      if (isConn && isConn.result) {
        // 如果连接已存在，则获取它
        this.db = await this.sqlite.retrieveConnection(this.dbName, false)
      } else {
        // 否则，创建新的连接
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false)
      }

      if (this.db) {
        await this.db.open()
        console.log(`Successfully opened database: ${this.dbName}`)
        await this.createTables()
        await this.insertInitialData()
      } else {
        throw new Error('Failed to create or retrieve database connection.')
      }
    } catch (e) {
      console.error('Error initializing SQLite:', e)
      throw e
    }
  }

  /**
   * 重置数据库：删除所有表，然后重新创建并插入初始数据。
   * 这在测试时非常有用，可以保证每次测试都从干净的环境开始。
   */
  public async resetDatabase(): Promise<void> {
    if (!this.db) {
      // 如果数据库未初始化，先尝试初始化
      await this.initialize()
    }

    if (!this.db) {
      throw new Error('Database not initialized for reset.')
    }

    try {
      // 禁用外键约束，以便可以删除表（即使有引用）
      await this.db.execute('PRAGMA foreign_keys = OFF;')
      console.log('Foreign keys temporarily disabled for reset.')

      // 删除所有表
      await this.db.execute('DROP TABLE IF EXISTS knowledge_cards;')
      await this.db.execute('DROP TABLE IF EXISTS knowledge_card_groups;')
      console.log('All tables dropped.')

      // 重新创建表
      await this.createTables()

      // 重新插入初始数据
      await this.insertInitialData()

      // 重新启用外键约束
      await this.db.execute('PRAGMA foreign_keys = ON;')
      console.log('Foreign keys re-enabled after reset.')
    } catch (e) {
      console.error('Error resetting database:', e)
      throw e
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized.')
    }

    const createGroupTableSQL = `
      CREATE TABLE IF NOT EXISTS knowledge_card_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL UNIQUE,
          subtitle TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `

    const createCardTableSQL = `
      CREATE TABLE IF NOT EXISTS knowledge_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          group_id INTEGER DEFAULT 0,
          last_reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          next_review_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          easiness_factor REAL DEFAULT 2.5,
          repetitions INTEGER DEFAULT 0,
          interval INTEGER DEFAULT 0,
          status TEXT DEFAULT 'new',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES knowledge_card_groups(id) ON DELETE SET NULL
      );
    `

    try {
      // 启用外键约束 (对于 SQLite 默认是关闭的)
      await this.db.execute('PRAGMA foreign_keys = ON;')
      console.log('Foreign keys enabled.')

      await this.db.execute(createGroupTableSQL)
      console.log('Table knowledge_card_groups created or already exists.')
      await this.db.execute(createCardTableSQL)
      console.log('Table knowledge_cards created or already exists.')
    } catch (e) {
      console.error('Error creating tables:', e)
      throw e
    }
  }

  /**
   * 插入初始数据（仅插入一个默认分组）
   */
  private async insertInitialData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized.')
    }

    const defaultGroup: KnowledgeCardGroup = {
      id: 0,
      title: '未分组',
      subtitle: '所有未分类的知识卡片',
    }

    try {
      // 检查默认分组是否已存在，避免重复插入
      const { values: existingGroups } = await this.db.query(
        `SELECT id FROM knowledge_card_groups WHERE id = ?`,
        [defaultGroup.id],
      )

      if (existingGroups && existingGroups.length === 0) {
        // 插入默认分组
        const groupInsertSQL = `INSERT INTO knowledge_card_groups (id, title, subtitle) VALUES (?, ?, ?);`
        await this.db.run(groupInsertSQL, [
          defaultGroup.id,
          defaultGroup.title,
          defaultGroup.subtitle,
        ])
        console.log('Default group inserted successfully.')
      } else {
        console.log('Default group already exists, skipping insertion.')
      }
    } catch (e: any) {
      // 如果发生唯一性约束错误，可以忽略
      if (
        e.message &&
        (e.message.includes('UNIQUE constraint failed') || e.message.includes('constraint failed'))
      ) {
        console.warn('Default group already exists or duplicate entry attempted:', e.message)
      } else {
        console.error('Error inserting default group:', e)
        throw e
      }
    }
  }

  /**
   * 根据 ID 获取单张知识卡片
   * @param cardId 卡片ID
   * @returns KnowledgeCard | undefined
   */
  public async getKnowledgeCardById(cardId: number): Promise<KnowledgeCard | undefined> {
    if (!this.db) throw new Error('Database not initialized.')
    // 明确列出所有需要的列
    const { values } = await this.db.query(
      `SELECT
        id, question, answer, group_id, last_reviewed_at, next_review_at,
        easiness_factor, repetitions, interval, status, created_at, updated_at
      FROM knowledge_cards WHERE id = ?;`,
      [cardId],
    )
    return values && values.length > 0 ? (values[0] as KnowledgeCard) : undefined
  }

  /**
   * 获取当前到期（需要复习）的知识卡片
   * @param limit 限制返回的数量
   * @returns KnowledgeCard[]
   */
  public async getDueCards(limit?: number): Promise<KnowledgeCard[]> {
    if (!this.db) throw new Error('Database not initialized.')
    const now = new Date().toISOString() // 获取当前时间 ISO 格式
    let query = `
      SELECT
        id, question, answer, group_id, last_reviewed_at, next_review_at,
        easiness_factor, repetitions, interval, status, created_at, updated_at
      FROM knowledge_cards
      WHERE next_review_at <= ? AND status IN ('new', 'learning')
      ORDER BY next_review_at ASC
    `
    const params = [now]

    if (limit !== undefined && limit !== null) {
      // 确保 limit 不是 undefined 或 null
      query += ` LIMIT ?;`
      params.push(limit.toString())
    } else {
      query += `;`
    }
    console.log(`Executing query: ${query} with params: ${params.join(', ')}`)
    const { values } = await this.db.query(query, params)
    return (values || []) as KnowledgeCard[]
  }

  /**
   * 获取新的知识卡片（未复习过的）
   * @param limit 限制返回的数量
   * @returns KnowledgeCard[]
   */
  public async getNewCards(limit?: number): Promise<KnowledgeCard[]> {
    if (!this.db) throw new Error('Database not initialized.')
    let query = `
      SELECT
        id, question, answer, group_id, last_reviewed_at, next_review_at,
        easiness_factor, repetitions, interval, status, created_at, updated_at
      FROM knowledge_cards
      WHERE status = 'new'
      ORDER BY created_at ASC
    `
    const params: (number | string)[] = []
    if (limit) {
      query += ` LIMIT ?;`
      params.push(limit)
    }
    const { values } = await this.db.query(query, params)
    return (values || []) as KnowledgeCard[]
  }

  /**
   * 根据 SM-2 算法更新卡片的复习状态
   * @param cardId 卡片ID
   * @param score 用户评分 (0-5)
   * @returns Promise<void>
   */
  public async updateCardReviewStatus(cardId: number, score: ReviewScore): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')

    const card = await this.getKnowledgeCardById(cardId)
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found.`)
    }

    let easinessFactor = card.easiness_factor
    let repetitions = card.repetitions
    let interval = card.interval
    let status: 'new' | 'learning' | 'mastered' = card.status

    // --- 1. SM-2 算法核心逻辑 ---
    if (score >= 3) {
      // 掌握或勉强掌握
      if (repetitions === 0) {
        interval = 1
      } else if (repetitions === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * easinessFactor)
      }
      repetitions++

      // 更新 easiness_factor
      easinessFactor += 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02)
      if (easinessFactor < 1.3) {
        easinessFactor = 1.3
      }
    } else {
      // 忘记或不确定
      repetitions = 0
      interval = 1 // 立即或短时间内再次复习
      easinessFactor -= 0.2
      if (easinessFactor < 1.3) {
        easinessFactor = 1.3
      }
    }

    // --- 2. 计算 next_review_at 和 last_reviewed_at ---
    const now = new Date()
    const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000) // 增加天数

    // --- 3. 更新 status 字段 ---
    if (status === 'new') {
      status = 'learning' // 新卡片第一次复习，变为学习中
    } else if (status === 'mastered' && score < 3) {
      status = 'learning' // 已掌握的卡片答错，降级回学习中
    } else if (status === 'learning') {
      // 定义“掌握”的条件
      const MASTERED_REPETITIONS_THRESHOLD = 5
      const MASTERED_INTERVAL_THRESHOLD_DAYS = 60 // 例如，复习间隔超过2个月
      if (
        repetitions >= MASTERED_REPETITIONS_THRESHOLD &&
        interval >= MASTERED_INTERVAL_THRESHOLD_DAYS
      ) {
        status = 'mastered'
      }
    }
    // 其他情况 status 保持不变

    // --- 4. 数据库更新 ---
    const updateSQL = `
      UPDATE knowledge_cards
      SET last_reviewed_at = ?, next_review_at = ?,
          easiness_factor = ?, repetitions = ?, interval = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
    `
    const params = [
      now.toISOString(),
      nextReviewAt.toISOString(),
      easinessFactor,
      repetitions,
      interval,
      status,
      cardId,
    ]

    try {
      await this.db.run(updateSQL, params)
      console.log(`Card ${cardId} review status updated successfully.`)
    } catch (e) {
      console.error(`Error updating card ${cardId} review status:`, e)
      throw e
    }
  }

  /**
   * 获取所有知识卡片组
   * @returns Promise<KnowledgeCardGroup[]>
   */
  public async getAllGroups(): Promise<KnowledgeCardGroup[]> {
    if (!this.db) throw new Error('Database not initialized.')
    const { values } = await this.db.query(`SELECT * FROM knowledge_card_groups ORDER BY id ASC;`)
    return (values || []) as KnowledgeCardGroup[]
  }

  /**
   * 获取某个特定组下的所有知识卡片
   * @param groupId 组ID
   * @returns Promise<KnowledgeCard[]>
   */
  public async getCardsInGroup(groupId: number): Promise<KnowledgeCard[]> {
    if (!this.db) throw new Error('Database not initialized.')
    const { values } = await this.db.query(
      `SELECT * FROM knowledge_cards WHERE group_id = ? ORDER BY id ASC;`,
      [groupId],
    )
    return (values || []) as KnowledgeCard[]
  }

  /**
   * 添加新的知识卡片
   * @param card 知识卡片数据 (无需ID,last_reviewed_at等，因为会默认填充)
   * @returns Promise<number> 插入的卡片ID
   */
  public async addCard(
    card: Omit<
      KnowledgeCard,
      | 'id'
      | 'last_reviewed_at'
      | 'next_review_at'
      | 'easiness_factor'
      | 'repetitions'
      | 'interval'
      | 'status'
      | 'created_at'
      | 'updated_at'
    >,
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized.')

    const insertSQL = `
      INSERT INTO knowledge_cards (
          question, answer, group_id
      ) VALUES (?, ?, ?);
    `
    const params = [
      card.question,
      card.answer,
      card.group_id ?? 0, // Use nullish coalescing to ensure group_id is 0 if undefined/null
    ]

    try {
      const { changes } = await this.db.run(insertSQL, params)
      if (changes && changes.lastId) {
        console.log(`Added new card with ID: ${changes.lastId}`)
        return changes.lastId
      }
      throw new Error('Failed to add new card.')
    } catch (e) {
      console.error('Error adding new card:', e)
      throw e
    }
  }

  /**
   * 更新现有知识卡片的内容或所属组
   * @param card 包含完整更新内容的卡片对象（必须有ID）
   * @returns Promise<void>
   */
  public async updateCard(card: KnowledgeCard): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')
    if (card.id === undefined) {
      throw new Error('Card ID is required for update.')
    }
    const updateSQL = `
      UPDATE knowledge_cards
      SET question = ?, answer = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
    `
    const params = [card.question, card.answer, card.group_id, card.id]
    const { changes } = await this.db.run(updateSQL, params)
    if (changes && changes.changes === 0) {
      throw new Error(`Card with ID ${card.id} not found for update.`)
    }
    console.log(`Card ${card.id} updated successfully.`)
  }

  /**
   * 删除知识卡片
   * @param cardId 卡片ID
   * @returns Promise<void>
   */
  public async deleteCard(cardId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')
    const deleteSQL = `DELETE FROM knowledge_cards WHERE id = ?;`
    const { changes } = await this.db.run(deleteSQL, [cardId])
    if (changes && changes.changes === 0) {
      throw new Error(`Card with ID ${cardId} not found for deletion.`)
    }
    console.log(`Card ${cardId} deleted successfully.`)
  }

  /**
   * 添加新的知识卡片组
   * @param group 知识卡片组数据 (无需ID)
   * @returns Promise<number> 插入的组ID
   */
  public async addGroup(
    group: Omit<KnowledgeCardGroup, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized.')
    const insertSQL = `INSERT INTO knowledge_card_groups (title, subtitle) VALUES (?, ?);`
    const params = [group.title, group.subtitle || null]
    const { changes } = await this.db.run(insertSQL, params)
    if (changes && changes.lastId) {
      console.log(`Added new group with ID: ${changes.lastId}`)
      return changes.lastId
    }
    throw new Error('Failed to add new group.')
  }

  /**
   * 更新知识卡片组信息
   * @param group 包含完整更新内容的组对象（必须有ID）
   * @returns Promise<void>
   */
  public async updateGroup(group: KnowledgeCardGroup): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')
    if (group.id === undefined) {
      throw new Error('Group ID is required for update.')
    }
    const updateSQL = `
      UPDATE knowledge_card_groups
      SET title = ?, subtitle = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
    `
    const params = [group.title, group.subtitle || null, group.id]
    const { changes } = await this.db.run(updateSQL, params)
    if (changes && changes.changes === 0) {
      throw new Error(`Group with ID ${group.id} not found for update.`)
    }
    console.log(`Group ${group.id} updated successfully.`)
  }

  /**
   * 删除知识卡片组
   * @param groupId 组ID
   * @returns Promise<void>
   */
  public async deleteGroup(groupId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')
    if (groupId === 0) {
      throw new Error('Cannot delete the default group (ID 0).')
    }
    const deleteSQL = `DELETE FROM knowledge_card_groups WHERE id = ?;`
    const { changes } = await this.db.run(deleteSQL, [groupId])
    if (changes && changes.changes === 0) {
      throw new Error(`Group with ID ${groupId} not found for deletion.`)
    }
    console.log(`Group ${groupId} deleted successfully.`)
  }

  /**
   * 导出所有数据为 SQL INSERT 语句字符串。
   * @returns Promise<string> 包含所有数据的 SQL INSERT 语句字符串。
   */
  public async exportToSQL(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized.')
    let sqlExport = `-- Exported from Agile Cards on ${new Date().toISOString()}\n\n`

    try {
      // 导出知识卡片组
      const { values: groups } = await this.db.query(
        `SELECT * FROM knowledge_card_groups ORDER BY id ASC;`,
      )
      sqlExport += `-- knowledge_card_groups data\n`
      for (const group of groups as KnowledgeCardGroup[]) {
        const title = group.title.replace(/'/g, "''") // 转义单引号
        const subtitle = group.subtitle ? group.subtitle.replace(/'/g, "''") : 'NULL'
        sqlExport += `INSERT INTO knowledge_card_groups (id, title, subtitle) VALUES (${group.id}, '${title}', ${subtitle === 'NULL' ? 'NULL' : "'" + subtitle + "'"});\n`
      }
      sqlExport += '\n'

      // 导出知识卡片
      const { values: cards } = await this.db.query(
        `SELECT * FROM knowledge_cards ORDER BY id ASC;`,
      )
      sqlExport += `-- knowledge_cards data\n`
      for (const card of cards as KnowledgeCard[]) {
        const question = card.question.replace(/'/g, "''")
        const answer = card.answer.replace(/'/g, "''")
        const lastReviewedAt = card.last_reviewed_at ? `'${card.last_reviewed_at}'` : 'NULL'
        const nextReviewAt = card.next_review_at ? `'${card.next_review_at}'` : 'NULL'
        const groupId = card.group_id !== null ? card.group_id : 'NULL'
        const status = `'${card.status}'`

        sqlExport += `INSERT INTO knowledge_cards (id, question, answer, group_id, last_reviewed_at, next_review_at, easiness_factor, repetitions, interval, status) VALUES (${card.id}, '${question}', '${answer}', ${groupId}, ${lastReviewedAt}, ${nextReviewAt}, ${card.easiness_factor}, ${card.repetitions}, ${card.interval}, ${status});\n`
      }

      console.log('Database exported to SQL successfully.')
      return sqlExport
    } catch (e) {
      console.error('Error exporting database to SQL:', e)
      throw e
    }
  }

  /**
   * 从 SQL INSERT 语句字符串导入数据。
   * 会清空现有卡片和分组数据，然后重新导入。
   * @param sqlString 包含 SQL INSERT 语句的字符串。
   * @returns Promise<void>
   */
  public async importFromSQL(sqlString: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized.')

    try {
      await this.db.execute('PRAGMA foreign_keys = OFF;')

      // 构造 SQL 任务列表
      const tasks: capTask[] = []

      // 清空现有数据
      tasks.push({ statement: 'DELETE FROM knowledge_cards' })
      tasks.push({ statement: 'DELETE FROM knowledge_card_groups' })
      tasks.push({ statement: "UPDATE sqlite_sequence SET seq = 0 WHERE name = 'knowledge_cards'" })
      tasks.push({
        statement: "UPDATE sqlite_sequence SET seq = 0 WHERE name = 'knowledge_card_groups'",
      })

      // 拆解 sqlString 插入语句（去除注释和空语句）
      const sqlStatements = sqlString
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => !line.startsWith('--')) // 去除注释行
        .join(' ') // 合并为单行
        .split(';') // 按分号拆分语句
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0) // 去除空语句

      for (const stmt of sqlStatements) {
        tasks.push({ statement: stmt + ';' })
      }

      // 执行事务
      await this.db.executeTransaction(tasks)

      // 重新插入默认分组（如果需要）
      await this.insertInitialData()

      console.log('Database import complete.')
    } catch (err) {
      console.error('Failed to import database:', err)
      throw err
    } finally {
      await this.db.execute('PRAGMA foreign_keys = ON;')
    }
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      await this.sqlite.closeConnection(this.dbName, false)
      this.db = null
      console.log(`Database ${this.dbName} closed.`)
    }
  }
}