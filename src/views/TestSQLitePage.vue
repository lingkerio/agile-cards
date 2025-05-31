<script setup lang="ts">
import { ref } from 'vue'
import { SqliteService } from '@/services/databaseService'

const sqliteService = new SqliteService()

const data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]

const currentIndex = ref(0)

const testAdd = async (name: string, email: string) => {
  await sqliteService.initDB()
  await sqliteService.addUser(name, email)
  const users = await sqliteService.getUsers()
  console.log(users)
  await sqliteService.closeDB()
}

const onClick = async () => {
  if (currentIndex.value >= data.length) {
    currentIndex.value = 0
    return
  }
  const { name, email } = data[currentIndex.value]
  await testAdd(name, email)
  currentIndex.value++
}
</script>

<template>
  <button @click="onClick">Test SQLite</button>
</template>
