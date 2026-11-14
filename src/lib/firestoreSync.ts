import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useAppStore } from '../store/useAppStore'
import { db } from './firebase'
import { mergeImportedPhysicalComics, PHYSICAL_IMPORT_VERSION } from './physicalLibrary'

let unsubSnapshot: (() => void) | null = null
let unsubStore: (() => void) | null = null
let lastSynced = ''

export function startSync(uid: string) {
  stopSync()
  const ref = doc(db, 'users', uid)

  unsubSnapshot = onSnapshot(
    ref,
    (snap) => {
      const data = snap.data() as { comics?: unknown; customCats?: unknown; physicalImportVersion?: number } | undefined
      if (!data) return
      const json = JSON.stringify(data)
      if (json === lastSynced) return
      lastSynced = json
      const needsPhysicalImport = (data.physicalImportVersion || 0) < PHYSICAL_IMPORT_VERSION
      useAppStore.setState({
        comics: needsPhysicalImport ? mergeImportedPhysicalComics((data.comics as any) ?? []) : ((data.comics as any) ?? []),
        customCats: (data.customCats as any) ?? [],
        physicalImportVersion: PHYSICAL_IMPORT_VERSION,
      })
    },
    (err) => console.error('Firestore 讀取失敗（可能是安全規則擋下這個帳號）', err),
  )

  unsubStore = useAppStore.subscribe((state) => {
    const payload = {
      comics: state.comics,
      customCats: state.customCats,
      physicalImportVersion: state.physicalImportVersion,
    }
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
