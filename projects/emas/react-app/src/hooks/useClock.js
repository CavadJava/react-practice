import { useState, useEffect } from 'react'

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek']

export function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('az-AZ', { hour12: false })
  const date = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  return { time, date }
}
