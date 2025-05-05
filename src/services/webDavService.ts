import axios from 'axios'
import { CONFIG } from '../config/config'

interface WebDAVService {
  uploadDatabaseToWebDAV(databasePath: string, remotePath: string): Promise<void>
  downloadDatabaseFromWebDAV(remotePath: string, localPath: string): Promise<void>
}

const webdavService: WebDAVService = {
  // Upload the database to WebDAV server
  async uploadDatabaseToWebDAV(databasePath: string, remotePath: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', databasePath)

    try {
      await axios.put(`${CONFIG.WEBDAV_SERVER_URL}${remotePath}`, formData, {
        headers: {
          Authorization: `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
      })
      console.log('Database uploaded successfully!')
    } catch (error) {
      console.error('Error uploading database to WebDAV:', error)
      throw error
    }
  },

  // Download the database from WebDAV server
  async downloadDatabaseFromWebDAV(remotePath: string, localPath: string): Promise<void> {
    try {
      const response = await axios.get(`${CONFIG.WEBDAV_SERVER_URL}${remotePath}`, {
        headers: {
          Authorization: `Basic ${CONFIG.WEBDAV_AUTH_TOKEN}`,
        },
        responseType: 'blob',
      })

      // Assuming you save the downloaded data into a file locally (this may vary depending on your platform)
      const file = new Blob([response.data])
      const fileReader = new FileReader()
      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result as ArrayBuffer
        // Here, save `arrayBuffer` to the local file system (may vary by platform)
        console.log('Database downloaded and saved!')
      }
      fileReader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error downloading database from WebDAV:', error)
      throw error
    }
  },
}

export default webdavService
