'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const TRACKING_INTERVAL = 15000
const GEOFENCE_RADIUS_METERS = 500

export function GpsTracker() {
  const { data: session } = useSession()
  const sessionUser = session?.user as any
  const userId = sessionUser?.id
  const role = sessionUser?.role
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastProjectRef = useRef<string | null>(null)
  const siteVisitIdRef = useRef<string | null>(null)

  const haversineDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }, [])

  const sendLocation = useCallback(async (latitude: number, longitude: number, accuracy: number | null, speed: number | null) => {
    if (!userId) return

    let battery = null
    try {
      const b = await (navigator as any).getBattery?.()
      if (b) battery = Math.round(b.level * 100)
    } catch {}

    try {
      const res = await fetch('/api/gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, latitude, longitude, accuracy, speed, batteryLevel: battery }),
      })
      const data = await res.json()

      if (data.location?.projectId && data.location.projectId !== lastProjectRef.current) {
        if (lastProjectRef.current && siteVisitIdRef.current) {
          await fetch('/api/site-visits', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: siteVisitIdRef.current, action: 'check-out' }),
          })
          siteVisitIdRef.current = null
        }

        if (data.location.projectId) {
          const visitRes = await fetch('/api/site-visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, projectId: data.location.projectId, latitude, longitude, accuracy }),
          })
          const visitData = await visitRes.json()
          siteVisitIdRef.current = visitData.data?.id || null
        }
        lastProjectRef.current = data.location.projectId
      }
    } catch {}
  }, [userId])

  useEffect(() => {
    if (!userId) return
    if (role !== 'ENGINEER' && role !== 'SURVEYOR') return

    if (!navigator.geolocation) return

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords
        sendLocation(latitude, longitude, accuracy, speed)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    watchIdRef.current = id

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId, role, sendLocation])

  return null
}
