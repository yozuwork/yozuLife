import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useAppStore } from '../store/useAppStore'
import { db } from './firebase'

let unsubSnapshot: (() => void) | null = null
let unsubStore: (() => void) | null = null
let lastSynced = ''

export function startSync(uid: string) {
  stopSync()
  const ref = doc(db, 'users', uid)

  unsubSnapshot = onSnapshot(ref, (snap) => {
    const data = snap.data() as { comics?: unknown; customCats?: unknown } | undefined
    if (!data) return
    const json = JSON.stringify(data)
    if (json === lastSynced) return
    lastSynced = json
    useAppStore.setState({
      comics: (data.comics as any) ?? [],
      customCats: (data.customCats as any) ?? [],
    })
  })

  unsubStore = useAppStore.subscribe((state) => {
    const payload = { comics: state.comics, customCats: state.customCats }
    const json = JSON.stringify(payload)
    if (json === lastSynced) return
    lastSynced = json
    setDoc(ref, payload, { merge: true }).catch((err) => console.error('Firestore sync failed', err))
  })
}

export function stopSync() {
  unsubSnapshot?.()
  unsubStore?.()
  unsubSnapshot = null
  unsubStore = null
  lastSynced = ''
}
