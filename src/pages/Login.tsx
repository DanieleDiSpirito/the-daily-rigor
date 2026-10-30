import { continueAsGuest, signIn, signOut, type AuthState } from '../lib/auth';

export function Login({ state }: { state: AuthState }) {
  return (
    <article className="page login">
      <div className="challenge-heading">
        <div className="kicker">Welcome</div>
        <h1>Sign in to The Daily Rigor</h1>
      </div>
      <section className="panel">
        {state.status === 'loading' && <p className="hint-text">Checking your session…</p>}
        {state.status === 'denied' && (
          <>
            <p className="feedback bad">
              {state.email ? <strong>{state.email}</strong> : 'This account'} cannot be used here: it needs a verified email address and, if the owner has restricted access, a place on the invitation list.
            </p>
            <button className="btn ghost" onClick={() => signOut()}>Use another account</button>
          </>
        )}
        {state.status === 'out' && (
          <>
            <p>
              Sign in with an account you already have. There is no password to remember or to leak: Google or GitHub verifies who you are, with the two-factor
              authentication you have set up there.
            </p>
            {state.error && <p className="feedback bad">{state.error}</p>}
            <div className="row">
              <button className="btn primary" onClick={() => signIn('google')}>Continue with Google</button>
              <button className="btn" onClick={() => signIn('github')}>Continue with GitHub</button>
            </div>
            <p className="hint-text">We only receive your name and email address, to recognise you and to keep your progress and streaks. The site owner may be notified when someone signs in.</p>
            <p className="feedback bad">Signing in starts from a clean slate: any progress saved in this browser as a guest is discarded, and from then on your progress is kept in your account.</p>
            <hr />
            <p>
              Just looking around? You can <button className="linklike" onClick={continueAsGuest}>continue as a guest</button>. Everything works except the C++ judge,
              and your progress is saved only in this browser, so it can be lost if you clear your browsing data.
            </p>
          </>
        )}
      </section>
    </article>
  );
}
