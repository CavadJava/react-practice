import { create } from 'zustand'
import { USERS } from '../data/seed'

let _nextId = USERS.length + 1

export const useUserStore = create((set) => ({
  users: USERS,

  add: (data) =>
    set(s => ({
      users: [...s.users, { id: _nextId++, giris: '—', online: false, ...data }],
    })),

  update: (id, data) =>
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...data } : u) })),

  remove: (id) =>
    set(s => ({ users: s.users.filter(u => u.id !== id) })),

  toggleBlock: (id) =>
    set(s => ({
      users: s.users.map(u =>
        u.id === id ? { ...u, status: u.status === 'Aktiv' ? 'Bloklanan' : 'Aktiv' } : u
      ),
    })),
}))
