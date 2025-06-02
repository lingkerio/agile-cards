<script setup lang="ts">
import { ref } from 'vue'
import { SqliteService } from '@/services/sqliteService'
import type { Group, Cards } from '@/services/sqliteService'

const sqliteService = new SqliteService()

const group_name = ref('')
const group_dis = ref('')
const card_hash = ref('')
const group_id = ref('')
const question = ref('')
const answer = ref('')
const reviewed_at = ref('')

const saveGroup = async () => {
  const group: Group = {
    group_name: group_name.value,
    group_dis:  group_dis.value
  };
  console.log('Saving group: ', group);
  await sqliteService.saveGroup(group);
  const allGroup: string[] = (await sqliteService.getGroup()).map(group => JSON.stringify(group));
  console.table('All group: ', allGroup);
}

const saveCards = async () => {
  const cards: Cards = {
    card_hash:   card_hash.value,
    group_id:    Number(group_id.value),
    question:    question.value,
    answer:      answer.value,
    reviewed_at: Number(reviewed_at.value)
  };
  console.log('Saving cards: ', cards);
  await sqliteService.saveCards(cards);
  const allCards: string[] = (await sqliteService.getCards()).map(cards => JSON.stringify(cards));
  console.log('All cards: ', allCards);
}
</script>

<template>
  <div>
    <h1>Group</h1>
    <p>Group Name</p>
    <input v-model="group_name"/>
    <p>Group Discription</p>
    <input v-model="group_dis"/>
    <button @click="saveGroup">Save Group</button>

    <h1>Card</h1>
    <p>Group ID</p>
    <input v-model="group_id"/>
    <p>Question</p>
    <input v-model="question"/>
    <p>Answer</p>
    <input v-model="answer"/>
    <button @click="saveCards">Save Cards</button>

    <p></p>
    <button @click="sqliteService.closeDB">Save</button>
  </div>
</template>
