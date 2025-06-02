import placeholder1  from '@/assets/images/placeholder/placeholder1.jpg'
import placeholder2  from '@/assets/images/placeholder/placeholder2.jpg'
import placeholder3  from '@/assets/images/placeholder/placeholder3.jpg'
import placeholder4  from '@/assets/images/placeholder/placeholder4.jpg'
import placeholder5  from '@/assets/images/placeholder/placeholder5.jpg'
import placeholder6  from '@/assets/images/placeholder/placeholder6.jpg'
import placeholder7  from '@/assets/images/placeholder/placeholder7.jpg'
import placeholder8  from '@/assets/images/placeholder/placeholder8.jpg'
import placeholder9  from '@/assets/images/placeholder/placeholder9.jpg'
import placeholder10 from '@/assets/images/placeholder/placeholder10.jpg'
import placeholder11 from '@/assets/images/placeholder/placeholder11.jpg'
import placeholder12 from '@/assets/images/placeholder/placeholder12.jpg'
import placeholder13 from '@/assets/images/placeholder/placeholder13.jpg'
import placeholder14 from '@/assets/images/placeholder/placeholder14.jpg'
import placeholder15 from '@/assets/images/placeholder/placeholder15.jpg'
import placeholder16 from '@/assets/images/placeholder/placeholder16.jpg'
import { defineStore } from 'pinia'

const placeholders = [
  placeholder1, 
  placeholder2, 
  placeholder3, 
  placeholder4, 
  placeholder5, 
  placeholder6, 
  placeholder7, 
  placeholder8, 
  placeholder9, 
  placeholder10,
  placeholder11,
  placeholder12,
  placeholder13,
  placeholder14,
  placeholder15,
  placeholder16
]

export const groupIMG = defineStore('groupIMG', () => {
  return placeholders;
})