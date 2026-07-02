import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <div
      className={inter.className}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #F0FDFA 0%, #FFFFFF 60%, #F0FDFA 100%)',
      }}
    >
      {/* Nav */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #99F6E4', padding: '16px 24px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D9488' }}>BillSG</span>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          maxWidth: '768px',
          width: '100%',
          margin: '0 auto',
          padding: '80px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-block',
            background: '#F0FDFA',
            border: '1px solid #5EEAD4',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#0D9488',
            marginBottom: '28px',
            letterSpacing: '0.02em',
          }}
        >
          Singapore Hospital Bill Navigator
        </div>

        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#1C1917',
            lineHeight: 1.15,
            marginBottom: '20px',
            maxWidth: '560px',
          }}
        >
          Understand your hospital bill and claim what you deserve
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: '#4B5563',
            lineHeight: 1.7,
            maxWidth: '500px',
            marginBottom: '48px',
          }}
        >
          BillSG checks your eligibility for government subsidies, MediFund, CHAS, and
          more — in under 2 minutes, with no sign-up required.
        </p>

        <Link
          href="/onboarding"
          style={{
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '18px 56px',
            fontSize: '1.2rem',
            fontWeight: 700,
            boxShadow: '0 4px 24px rgba(13,148,136,0.40)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: '16px',
          }}
        >
          Get Started — It&apos;s Free
        </Link>

        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '64px' }}>
          Takes about 2 minutes · No sign-up needed
        </p>

        {/* Feature tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            width: '100%',
            maxWidth: '640px',
          }}
        >
          {[
            { icon: '📋', label: '14 schemes checked', sub: 'Instantly, for free' },
            { icon: '🏥', label: 'Upload your bill', sub: 'Get line-by-line clarity' },
            { icon: '🛡️', label: 'Private & secure', sub: 'No data stored' },
          ].map(({ icon, label, sub }) => (
            <div
              key={label}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '1rem',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: '1.75rem' }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1C1917' }}>{label}</span>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{sub}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: '#F0FDFA',
          borderTop: '1px solid #99F6E4',
          padding: '24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#78716C',
        }}
      >
        BillSG is a guidance tool only. Always consult a Medical Social Worker before taking action.
      </footer>
    </div>
  )
}
