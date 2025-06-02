/**
 * WebDAV服务模块
 * 提供WebDAV文件上传、下载和数据库同步功能
 *
 * 使用说明:
 *
 * 1. 数据库备份:
 *    - 调用uploadDatabaseToWebDAV函数将SQLite数据库备份到WebDAV服务器
 *    - 示例: await webdavService.uploadDatabaseToWebDAV('/backup/database.sql')
 *    - 参数: WebDAV服务器上的保存路径（以/开头）
 *
 * 2. 数据库恢复:
 *    - 调用downloadDatabaseFromWebDAV函数从WebDAV服务器恢复数据库
 *    - 示例: await webdavService.downloadDatabaseFromWebDAV('/backup/database.sql')
 *    - 参数: WebDAV服务器上的文件路径（以/开头）
 *    - 注意: 此操作会完全覆盖本地数据库，请谨慎使用
 *
 * 3. 文件上传:
 *    - 调用uploadFileToWebDAV函数上传任意内容到WebDAV服务器
 *    - 示例: await webdavService.uploadFileToWebDAV('文件内容', '/path/file.txt', 'text/plain')
 *    - 参数1: 文件内容字符串
 *    - 参数2: WebDAV服务器上的文件路径（以/开头）
 *    - 参数3: 内容类型（可选，默认为text/plain）
 *
 * 4. 文件下载:
 *    - 调用downloadFileFromWebDAV函数从WebDAV服务器下载文件
 *    - 示例: const content = await webdavService.downloadFileFromWebDAV('/path/file.txt')
 *    - 参数: WebDAV服务器上的文件路径（以/开头）
 *    - 返回: 文件内容（字符串）
 *
 * 5. 目录创建:
 *    - 上传文件时会自动创建必要的目录
 *    - 也可以单独调用ensureDirectoryExists函数来创建目录
 *    - 示例: await webdavService.ensureDirectoryExists('/path/to/directory/')
 *
 * 注意事项:
 * - 请确保在config/config.ts中正确设置WEBDAV_SERVER_URL和WEBDAV_AUTH_TOKEN
 * - WebDAV操作仅在Android/iOS设备上支持，Web平台不支持数据库操作
 * - 所有接口都会返回Promise，建议使用try/catch处理可能的错误
 */

import { Capacitor } from '@capacitor/core'
import { CONFIG } from '../config/config'
import { SqliteService } from './databaseService'

// 超时设置
const DEFAULT_TIMEOUT = 60000 // 60秒

interface WebDAVService {
  uploadDatabaseToWebDAV(remotePath: string): Promise<void>
  downloadDatabaseFromWebDAV(remotePath: string): Promise<void>
  uploadFileToWebDAV(content: string, remotePath: string, contentType?: string): Promise<void>
  downloadFileFromWebDAV(remotePath: string): Promise<any>
  ensureDirectoryExists(filePath: string): Promise<void>
}

// WebDAV请求结果接口
interface WebDAVResult {
  success: boolean
  data?: any
  status?: number
  error?: string
}

const webdavService: WebDAVService = {
  // 上传数据库到WebDAV服务器
  async uploadDatabaseToWebDAV(remotePath: string): Promise<void> {
    try {
      // 确保文件后缀为 .sql
      const formattedPath = remotePath.endsWith('.sql') ? remotePath : `${remotePath}.sql`
      console.log(`准备导出数据库到WebDAV路径: ${formattedPath}`)

      // 检查平台
      if (Capacitor.getPlatform() === 'web') {
        console.log('Web平台不支持完整的SQLite功能，跳过导出')
        throw new Error('Web平台不支持数据库导出功能，请在移动设备上使用')
      }

      // 创建数据库服务实例
      const dbService = new SqliteService()
      await dbService.initialize()

      // 使用 databaseService 导出为 SQL
      console.log('尝试导出数据库为 SQL 字符串')
      const sqlString = await dbService.exportToSQL()
      console.log('数据库导出为 SQL 成功')

      // 上传到WebDAV
      await this.uploadFileToWebDAV(sqlString, formattedPath, 'text/plain')
      console.log('数据库上传成功!')

      // 关闭数据库连接
      await dbService.close()
    } catch (error: any) {
      if (error.response) {
        console.error('WebDAV响应错误:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('WebDAV无响应:', error.request)
      } else {
        console.error('WebDAV请求设置错误:', error.message)
      }
      throw error
    }
  },

  // 从WebDAV服务器下载数据库
  async downloadDatabaseFromWebDAV(remotePath: string): Promise<void> {
    try {
      // 确保文件后缀为 .sql
      const formattedPath = remotePath.endsWith('.sql') ? remotePath : `${remotePath}.sql`
      console.log(`开始从WebDAV下载数据库: ${formattedPath}`)

      // 检查平台
      if (Capacitor.getPlatform() === 'web') {
        console.log('Web平台不支持完整的SQLite功能，跳过下载')
        throw new Error('Web平台不支持数据库下载功能，请在移动设备上使用')
      }

      // 下载SQL数据
      const sqlString = await this.downloadFileFromWebDAV(formattedPath)
      console.log('SQL数据下载成功')

      // 创建数据库服务实例
      const dbService = new SqliteService()
      await dbService.initialize()

      // 使用 databaseService 导入 SQL
      console.log('尝试导入 SQL 数据')
      await dbService.importFromSQL(sqlString)
      console.log('数据库导入成功!')

      // 关闭数据库连接
      await dbService.close()
    } catch (error: any) {
      if (error.response) {
        console.error('WebDAV响应错误:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('WebDAV无响应:', error.request)
      } else {
        console.error('WebDAV请求设置错误:', error.message)
      }
      console.error(`从WebDAV下载或导入数据库错误:`, error)
      throw error
    }
  },

  // 使用XMLHttpRequest上传文件到WebDAV
  async uploadFileToWebDAV(
    content: string,
    remotePath: string,
    contentType: string = 'text/plain',
  ): Promise<void> {
    const absoluteUrl = `${CONFIG.WEBDAV_SERVER_URL}${remotePath.startsWith('/') ? remotePath.substring(1) : remotePath}`
    console.log(`开始上传到WebDAV: ${absoluteUrl}`)

    // 确保目录存在
    await this.ensureDirectoryExists(remotePath)

    // 使用XMLHttpRequest方法
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', absoluteUrl, true)
      xhr.setRequestHeader('Authorization', `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.timeout = DEFAULT_TIMEOUT

      const uploadResult = await new Promise<WebDAVResult>((resolve, reject) => {
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, status: xhr.status })
          } else {
            resolve({ success: false, status: xhr.status, error: xhr.responseText })
          }
        }

        xhr.onerror = function () {
          reject(new Error(`上传错误: ${xhr.statusText || '未知错误'}`))
        }

        xhr.ontimeout = function () {
          reject(new Error('上传超时'))
        }

        xhr.send(content)
      })

      if (uploadResult.success) {
        console.log(`XMLHttpRequest上传成功! 状态码: ${uploadResult.status}`)
        return
      } else {
        throw new Error(`XMLHttpRequest上传失败: 状态码 ${uploadResult.status}`)
      }
    } catch (error) {
      console.error(`XMLHttpRequest上传失败: ${error}`)
      throw new Error('上传失败')
    }
  },

  // 使用XMLHttpRequest从WebDAV下载文件
  async downloadFileFromWebDAV(remotePath: string): Promise<any> {
    const absoluteUrl = `${CONFIG.WEBDAV_SERVER_URL}${remotePath.startsWith('/') ? remotePath.substring(1) : remotePath}`
    console.log(`开始从WebDAV下载: ${absoluteUrl}`)

    // 使用XMLHttpRequest方法
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', absoluteUrl, true)
      xhr.setRequestHeader('Authorization', `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`)
      xhr.responseType = 'text'
      xhr.timeout = DEFAULT_TIMEOUT

      const downloadResult = await new Promise<WebDAVResult>((resolve, reject) => {
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, status: xhr.status, data: xhr.responseText })
          } else {
            resolve({ success: false, status: xhr.status, error: xhr.responseText })
          }
        }

        xhr.onerror = function () {
          reject(new Error(`下载错误: ${xhr.statusText || '未知错误'}`))
        }

        xhr.ontimeout = function () {
          reject(new Error('下载超时'))
        }

        xhr.send()
      })

      if (downloadResult.success && downloadResult.data) {
        console.log(`XMLHttpRequest下载成功! 状态码: ${downloadResult.status}`)
        return downloadResult.data
      } else {
        throw new Error(`XMLHttpRequest下载失败: 状态码 ${downloadResult.status}`)
      }
    } catch (error) {
      console.error(`XMLHttpRequest下载失败: ${error}`)
      throw new Error('下载失败')
    }
  },

  // 确保目录存在
  async ensureDirectoryExists(filePath: string): Promise<void> {
    // 如果路径不包含/，则不需要创建目录
    if (!filePath.includes('/') || filePath.lastIndexOf('/') === 0) {
      return
    }

    // 提取目录路径
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
    console.log(`检查并创建目录: ${dirPath}`)

    // 构造目录URL
    const dirUrl = `${CONFIG.WEBDAV_SERVER_URL}${dirPath.startsWith('/') ? dirPath.substring(1) : dirPath}/.dir`
    console.log(`尝试通过PUT请求创建目录标记: ${dirUrl}`)

    try {
      // 使用XMLHttpRequest创建目录
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', dirUrl, true)
      xhr.setRequestHeader('Authorization', `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`)
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.timeout = DEFAULT_TIMEOUT

      const result = await new Promise<WebDAVResult>((resolve, reject) => {
        xhr.onload = function () {
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 201 || xhr.status === 409) {
            // 409表示冲突，通常意味着目录已存在
            resolve({ success: true, status: xhr.status })
          } else {
            resolve({ success: false, status: xhr.status, error: xhr.responseText })
          }
        }

        xhr.onerror = function () {
          reject(new Error(`创建目录错误: ${xhr.statusText || '未知错误'}`))
        }

        xhr.ontimeout = function () {
          reject(new Error('创建目录超时'))
        }

        // 发送空内容
        xhr.send('')
      })

      if (result.success) {
        console.log(`XMLHttpRequest创建目录成功: ${dirPath}`)
        return
      } else {
        throw new Error(`创建目录失败: 状态码 ${result.status}`)
      }
    } catch (error) {
      console.error(`XMLHttpRequest创建目录失败: ${error}`)
      console.warn('无法创建目录，但仍将尝试上传')
    }
  },
}

export default webdavService
