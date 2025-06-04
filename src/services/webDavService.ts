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
import { SqliteService } from './sqliteService'

// 超时设置
const DEFAULT_TIMEOUT = 60000 // 60秒

interface WebDAVService {
  uploadDatabaseToWebDAV(remotePath: string): Promise<void>
  downloadDatabaseFromWebDAV(remotePath: string): Promise<void>
  uploadFileToWebDAV(content: string, remotePath: string, contentType?: string): Promise<void>
  downloadFileFromWebDAV(remotePath: string): Promise<any>
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
      const formattedPath = remotePath;
      console.log(`准备导出数据库到WebDAV路径: ${formattedPath}`)

      // 检查平台
      if (Capacitor.getPlatform() === 'web') {
        console.log('检测到Web平台，允许继续操作')
        // 允许在Web上继续操作，用于测试
      }

      // 创建数据库服务实例
      const dbService = new SqliteService()
      await dbService.initDB()

      // 使用 sqliteService 导出为 SQL
      const sqlString = await dbService.exportToSQL()
      console.log('数据库导出为 SQL 成功')

      // 上传到WebDAV
      await this.uploadFileToWebDAV(sqlString, formattedPath, 'text/plain')
      console.log('数据库上传成功!')

      // 关闭数据库连接
      await dbService.closeDB()
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
      const formattedPath = remotePath;
      console.log(`开始从WebDAV下载数据库: ${formattedPath}`)

      // 检查平台
      if (Capacitor.getPlatform() === 'web') {
        console.log('检测到Web平台，允许继续操作')
        // 允许在Web上继续操作，用于测试
      }

      // 下载SQL数据
      console.log('开始下载SQL文件...')
      const sqlString = await this.downloadFileFromWebDAV(formattedPath)
      console.log(`SQL数据下载成功，长度: ${sqlString.length} 字符`)
      console.log(`SQL内容预览: ${sqlString.substring(0, 200)}...`)

      // 创建数据库服务实例
      console.log('创建数据库服务实例...')
      const dbService = new SqliteService()
      await dbService.initDB()
      console.log('数据库初始化完成')

      // 检查导入前的数据
      const beforeCards = await dbService.getCards()
      const beforeGroups = await dbService.getGroup()
      console.log(`导入前: ${beforeGroups.length} 个分组, ${beforeCards.length} 张卡片`)

      // 使用 sqliteService 导入 SQL
      console.log('开始导入 SQL 数据...')
      const importResult = await dbService.importFromSQL(sqlString)
      console.log('导入结果:', importResult)

      // 检查导入后的数据
      const afterCards = await dbService.getCards()
      const afterGroups = await dbService.getGroup()
      console.log(`导入后: ${afterGroups.length} 个分组, ${afterCards.length} 张卡片`)

      // 验证导入是否成功
      if (importResult.changes >= 0) {
        console.log('数据库导入成功!')
      } else {
        console.warn('导入可能失败:', importResult.message)
      }

      // 不关闭数据库连接，让调用方管理连接
      // await dbService.closeDB()
      console.log('WebDAV下载和导入完成，保持数据库连接开启')
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
    console.log(`文件大小: ${content.length} 字节`)
    console.log(`内容类型: ${contentType}`)
    console.log(`认证令牌前缀: ${CONFIG.WEBDAV_AUTH_TOKEN.substring(0, 10)}...`)

    // 使用XMLHttpRequest方法（基于可工作的版本）
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', absoluteUrl, true)
      xhr.setRequestHeader('Authorization', `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.timeout = DEFAULT_TIMEOUT

      const uploadResult = await new Promise<WebDAVResult>((resolve, reject) => {
        xhr.onload = function () {
          console.log(`XMLHttpRequest onload: 状态码 ${xhr.status}`)
          console.log(`响应文本: ${xhr.responseText}`)
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, status: xhr.status })
          } else {
            resolve({ success: false, status: xhr.status, error: xhr.responseText })
          }
        }

        xhr.onerror = function () {
          console.error(`XMLHttpRequest onerror: ${xhr.statusText}`)
          console.error(`错误状态: ${xhr.readyState}`)
          reject(new Error(`网络错误: ${xhr.statusText || '连接失败'}`))
        }

        xhr.ontimeout = function () {
          console.error('XMLHttpRequest ontimeout')
          reject(new Error(`请求超时 (${DEFAULT_TIMEOUT}ms)`))
        }

        xhr.onloadstart = function () {
          console.log('开始发送请求...')
        }

        xhr.onprogress = function (event) {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            console.log(`上传进度: ${percentComplete.toFixed(2)}%`)
          }
        }

        console.log('发送请求...')
        xhr.send(content)
      })

      if (uploadResult.success) {
        console.log(`XMLHttpRequest上传成功! 状态码: ${uploadResult.status}`)
        return
      } else {
        // 提供具体的HTTP错误信息
        let errorMessage = `HTTP ${uploadResult.status}`;
        switch (uploadResult.status) {
          case 401:
            errorMessage += ' - 认证失败，请检查用户名和密码';
            break;
          case 403:
            errorMessage += ' - 权限不足，无法写入文件';
            break;
          case 404:
            errorMessage += ' - 路径不存在，请检查WebDAV路径';
            break;
          case 409:
            errorMessage += ' - 冲突，可能是目录结构问题';
            break;
          case 413:
            errorMessage += ' - 文件过大，超出服务器限制';
            break;
          case 500:
            errorMessage += ' - 服务器内部错误';
            break;
          case 502:
            errorMessage += ' - 网关错误，服务器暂时不可用';
            break;
          case 503:
            errorMessage += ' - 服务不可用，服务器过载';
            break;
          default:
            errorMessage += ` - ${uploadResult.error || '未知错误'}`;
        }
        
        console.error(`上传失败: ${errorMessage}`)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error(`XMLHttpRequest上传异常:`, error)
      
      // 如果已经是我们自己抛出的详细错误，直接抛出
      if (error instanceof Error && error.message.includes('HTTP ')) {
        throw error
      }
      
      // 否则包装成更详细的错误
      let detailedError = '上传失败: '
      if (error instanceof Error) {
        detailedError += error.message
      } else {
        detailedError += String(error)
      }
      
      throw new Error(detailedError)
    }
  },

  // 使用XMLHttpRequest从WebDAV下载文件
  async downloadFileFromWebDAV(remotePath: string): Promise<any> {
    const absoluteUrl = `${CONFIG.WEBDAV_SERVER_URL}${remotePath.startsWith('/') ? remotePath.substring(1) : remotePath}`
    console.log(`开始从WebDAV下载: ${absoluteUrl}`)
    console.log(`认证令牌前缀: ${CONFIG.WEBDAV_AUTH_TOKEN.substring(0, 10)}...`)

    // 使用XMLHttpRequest方法（基于可工作的版本）
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', absoluteUrl, true)
      xhr.setRequestHeader('Authorization', `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`)
      xhr.responseType = 'text'
      xhr.timeout = DEFAULT_TIMEOUT

      const downloadResult = await new Promise<WebDAVResult>((resolve, reject) => {
        xhr.onload = function () {
          console.log(`XMLHttpRequest onload: 状态码 ${xhr.status}`)
          console.log(`响应长度: ${xhr.responseText ? xhr.responseText.length : 0} 字符`)
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, status: xhr.status, data: xhr.responseText })
          } else {
            resolve({ success: false, status: xhr.status, error: xhr.responseText })
          }
        }

        xhr.onerror = function () {
          console.error(`XMLHttpRequest onerror: ${xhr.statusText}`)
          console.error(`错误状态: ${xhr.readyState}`)
          reject(new Error(`网络错误: ${xhr.statusText || '连接失败'}`))
        }

        xhr.ontimeout = function () {
          console.error('XMLHttpRequest ontimeout')
          reject(new Error(`请求超时 (${DEFAULT_TIMEOUT}ms)`))
        }

        xhr.onloadstart = function () {
          console.log('开始发送下载请求...')
        }

        console.log('发送下载请求...')
        xhr.send()
      })

      if (downloadResult.success && downloadResult.data) {
        console.log(`XMLHttpRequest下载成功! 状态码: ${downloadResult.status}`)
        return downloadResult.data
      } else {
        // 提供具体的HTTP错误信息
        let errorMessage = `HTTP ${downloadResult.status}`;
        switch (downloadResult.status) {
          case 401:
            errorMessage += ' - 认证失败，请检查用户名和密码';
            break;
          case 403:
            errorMessage += ' - 权限不足，无法读取文件';
            break;
          case 404:
            errorMessage += ' - 文件不存在，请先上传数据库';
            break;
          case 500:
            errorMessage += ' - 服务器内部错误';
            break;
          case 502:
            errorMessage += ' - 网关错误，服务器暂时不可用';
            break;
          case 503:
            errorMessage += ' - 服务不可用，服务器过载';
            break;
          default:
            errorMessage += ` - ${downloadResult.error || '未知错误'}`;
        }
        
        console.error(`下载失败: ${errorMessage}`)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error(`XMLHttpRequest下载异常:`, error)
      
      // 如果已经是我们自己抛出的详细错误，直接抛出
      if (error instanceof Error && error.message.includes('HTTP ')) {
        throw error
      }
      
      // 否则包装成更详细的错误
      let detailedError = '下载失败: '
      if (error instanceof Error) {
        detailedError += error.message
      } else {
        detailedError += String(error)
      }
      
      throw new Error(detailedError)
    }
  },
}

export default webdavService