import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { signInWithGoogle, signOutUser } from '../lib/firebase'
import { startSync, stopSync } from '../lib/firestoreSync'
import './AuthGate.css'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!user) return
    startSync(user.uid)
    return () => stopSync()
  }, [user])

  if (loading) {
    return <div className="authgate authgate--loading">載入中…</div>
  }

  if (!user) {
    return (
      <div className="authgate">
        <div className="authgate__card">
          <div className="authgate__kicker">Manga Books</div>
          <h1>個人收藏庫</h1>
          <p>登入 Google 帳號，開始同步你的收藏資料</p>
          <button className="authgate__btn" onClick={() => signInWithGoogle()}>
            使用 Google 登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="authgate__user">
        {user.photoURL && <img src={user.photoURL} alt="" className="authgate__avatar" />}
        <span className="authgate__name">{user.displayName}</span>
        <button className="authgate__signout" onClick={() => signOutUser()}>
          登出
        </button>
      </div>
      {children}
    </>
  )
}
