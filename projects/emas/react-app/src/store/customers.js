import { create } from 'zustand'
import { CUSTOMERS } from '../data/seed'

let _nextId = CUSTOMERS.length + 1

export const useCustomerStore = create((set, get) => ({
  customers: CUSTOMERS,

  add: (data) => {
    const now = new Date().toLocaleDateString('az-AZ').replace(/\//g, '.')
    set(s => ({ customers: [...s.customers, { id: _nextId++, tarix: now, ...data }] }))
  },

  update: (id, data) =>
    set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data } : c) })),

  remove: (id) =>
    set(s => ({ customers: s.customers.filter(c => c.id !== id) })),

  // Derived selectors
  getFiltered: (search, status) => {
    const all = get().customers
    const q = search.toLowerCase()
    return all.filter(c => {
      const matchQ = !q || `${c.ad} ${c.soyad} ${c.email} ${c.fin}`.toLowerCase().includes(q)
      const matchS = !status || c.status === status
      return matchQ && matchS
    })
  },
}))
