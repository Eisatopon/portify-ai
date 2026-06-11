'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { getBasketPrices, calcDiscount } from '../services/priceService'
import { ALL_SUPERMARKETS, getFlag } from '@/src/data/supermarkets'

// ─── helper ───────────────────────────────────────────────────────────────────

function handleNonAbortError(err, fallbackMessage, setErrorFn) {
  if (err.name === 'AbortError') return
  setErrorFn(err.message || fallbackMessage)
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useBasket() {
  const [items, setItems]     = useState([])   // { id, name, quantity, price }
  const [totals, setTotals]   = useState({})   // { supermarketId: totalPrice }
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [isStale, setIsStale] = useState(false)

  const abortRef = useRef(null)

  // ─── items management ───────────────────────────────────────────────────────

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === product.id)
      if (exists) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsStale(true)
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId))
    setTotals({})
    setIsStale(false)
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    const parsed = Number(quantity)
    const q = Number.isFinite(parsed) ? Math.floor(parsed) : 1

    if (q <= 0) {
      removeItem(productId)
      return
    }

    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: q } : i))
    )
    setTotals({})
    setIsStale(true)
  }, [removeItem])

  const clearBasket = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setItems([])
    setTotals({})
    setError(null)
    setLoading(false)
    setIsStale(false)
  }, [])

  // ─── σύγκριση τιμών καλαθιού ────────────────────────────────────────────────

  const compareBasket = useCallback(async () => {
    if (items.length === 0) {
      setTotals({})
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const productIds = items.map((i) => i.id)
      const data = await getBasketPrices(productIds, { signal: controller.signal })

      if (abortRef.current !== controller) return
      setTotals(data)
      setIsStale(false)
    } catch (err) {
      if (abortRef.current !== controller) return
      handleNonAbortError(err, 'Σφάλμα σύγκρισης καλαθιού', setError)
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }, [items])

  // ─── derived ─────────────────────────────────────────────────────────────────

  const itemCount = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity, 0),
    [items]
  )

  const totalItemsValue = useMemo(
    () => items.reduce((sum, i) => sum + (i.currentPrice || 0) * i.quantity, 0),
    [items]
  )

  const isEmpty   = items.length === 0
  const hasTotals = useMemo(() => Object.keys(totals).length > 0, [totals])

  const rankedSupermarkets = useMemo(() => {
    if (!hasTotals) return []

    return Object.entries(totals)
      .filter(([, total]) => typeof total === 'number' && Number.isFinite(total))
      .map(([id, total]) => {
        const store = ALL_SUPERMARKETS.find((s) => s.id === id)
        return {
          id,
          name:  store?.name  || id,
          color: store?.color || '#888',
          flag:  store ? getFlag(store.country) : '',
          total,
        }
      })
      .sort((a, b) => a.total - b.total)
  }, [totals])

  const savings = useMemo(() => {
    if (rankedSupermarkets.length < 2) return 0
    const cheapest     = rankedSupermarkets[0].total
    const mostExpensive = rankedSupermarkets[rankedSupermarkets.length - 1].total
    return Math.round((mostExpensive - cheapest) * 100) / 100
  }, [rankedSupermarkets])

  // calcDiscount(mostExpensive, cheapest) — old=ακριβότερο, current=φθηνότερο
  const savingsPercent = useMemo(() => {
    if (rankedSupermarkets.length < 2) return 0
    const cheapest      = rankedSupermarkets[0].total
    const mostExpensive = rankedSupermarkets[rankedSupermarkets.length - 1].total
    return calcDiscount(mostExpensive, cheapest)
  }, [rankedSupermarkets])

  return {
    // state
    items,
    totals,
    loading,
    error,
    isStale,
    // derived
    itemCount,
    totalItemsValue,
    isEmpty,
    hasTotals,
    rankedSupermarkets,
    savings,
    savingsPercent,
    // actions
    addItem,
    removeItem,
    updateQuantity,
    clearBasket,
    compareBasket,
  }
}