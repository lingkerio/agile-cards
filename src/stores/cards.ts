import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCardsStore = defineStore('cards', () => {
  const cards = ref([
    {
      id: 1,
      question: 'What is Vue.js?',
      answer: 'Vue.js is a progressive JavaScript framework for building user interfaces.'
    },
    {
      id: 2,
      question: 'What is TypeScript?',
      answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.'
    },
    {
      id: 3,
      question: 'What is Capacitor?',
      answer: 'Capacitor is a cross-platform native runtime for web apps.'
    },
    {
      id: 4,
      question: 'What is Pinia?',
      answer: 'Pinia is the official state management library for Vue.js.'
    },
    {
      id: 5,
      question: 'What are Vue Components?',
      answer: 'Components are reusable Vue instances with a name that encapsulate code, template, and styles.'
    },
    {
      id: 6,
      question: 'What is Git?',
      answer: 'Git is a distributed version control system for tracking changes in source code.'
    },
    {
      id: 7,
      question: 'What is HTML5?',
      answer: 'HTML5 is the latest version of HTML, introducing new elements and APIs for modern web development.'
    },
    {
      id: 8,
      question: 'What is CSS Flexbox?',
      answer: 'Flexbox is a CSS layout model that allows responsive elements within a container to be automatically arranged.'
    },
    {
      id: 9,
      question: 'What is ES6?',
      answer: 'ES6 (ECMAScript 2015) is a significant update to JavaScript that adds new syntax and features.'
    },
    {
      id: 10,
      question: 'What is npm?',
      answer: 'npm (Node Package Manager) is the default package manager for Node.js and JavaScript.'
    },
    {
      id: 11,
      question: 'What is REST API?',
      answer: 'REST API is an architectural style for distributed systems, commonly used for web APIs.'
    },
    {
      id: 12,
      question: 'What is Docker?',
      answer: 'Docker is a platform for developing, shipping, and running applications in containers.'
    },
    {
      id: 13,
      question: 'What is CI/CD?',
      answer: 'CI/CD is a method to frequently deliver apps by introducing automation into development stages.'
    },
    {
      id: 14,
      question: 'What is JWT?',
      answer: 'JSON Web Token (JWT) is a compact URL-safe means of representing claims between two parties.'
    },
    {
      id: 15,
      question: 'What is WebSocket?',
      answer: 'WebSocket is a communication protocol that provides full-duplex communication between client and server.'
    }
  ])

  return { cards }
})