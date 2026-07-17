'use client'

// Modale de vérification du téléphone, superposée à n'importe quelle vue.
// Décorrélée de l'espace "Vendre un manuel" (où la vérification vivait avant),
// pour qu'on ne quitte jamais son contexte (Tuteurs, Colocs, Manuels).
// La logique OTP (handleSendCode / handleVerifyOtp) reste dans /app et est
// passée en props — ce composant ne fait que l'emballage visuel.
export default function PhoneVerifyModal({
  open, onClose,
  phone, setPhone, phoneError, setPhoneError, handleSendCode, sendingCode,
  phoneStep, setPhoneStep,
  otp, setOtp, otpError, setOtpError, handleVerifyOtp, verifyingCode,
}) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 440, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f0f4f8', color: '#718096', fontSize: 16, cursor: 'pointer' }}
        >×</button>

        {phoneStep === 'enter' ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e4a', margin: '0 8px 8px 0' }}>
              Vérifie ton numéro de téléphone
            </h2>
            <p style={{ color: '#718096', fontSize: 14, margin: '0 0 16px' }}>
              Pour la sécurité des membres, on vérifie ton numéro. Tu reviens directement à ce que tu faisais juste après.
            </p>

            <div style={{
              background: '#f0f4f8', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4a5568'
            }}>
              <span style={{ fontSize: 20 }}>🇨🇦</span>
              <span>Réservé aux membres avec un <strong>numéro nord-américain (+1)</strong> — Canada et États-Unis.</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
                Numéro de téléphone
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${phoneError ? '#e53e3e' : '#cbd5e0'}`, borderRadius: 8, overflow: 'hidden' }}>
                <span style={{
                  padding: '12px 14px', background: '#f0f4f8',
                  borderRight: '1px solid #cbd5e0', color: '#1a2e4a',
                  fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>🇨🇦 +1</span>
                <input
                  placeholder="ex: 5145551234"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                  style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {phoneError && <p style={{ color: '#e53e3e', fontSize: 13, margin: '-8px 0 12px' }}>{phoneError}</p>}

            <p style={{ fontSize: 12, color: '#a0aec0', margin: '0 0 20px' }}>
              10 chiffres sans espaces ni tirets · ex: 5145551234
            </p>

            <button
              onClick={handleSendCode}
              disabled={sendingCode}
              style={{ width: '100%', background: sendingCode ? '#a0aec0' : '#00c9a7', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: sendingCode ? 'not-allowed' : 'pointer' }}
            >
              {sendingCode ? 'Envoi en cours...' : 'Recevoir le code par SMS'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: '#f0fdf9', border: '1px solid #00c9a7',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#00a88a', fontWeight: 600
            }}>
              <span>👍</span> Le code a été envoyé à ton téléphone.
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e4a', margin: '0 8px 8px 0' }}>
              Entre ton code de vérification
            </h2>
            <p style={{ color: '#718096', fontSize: 14, margin: '0 0 20px' }}>
              Vérifie tes SMS. Le code (6 chiffres) peut prendre une à deux minutes à arriver.
            </p>

            <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
              Code de vérification
            </label>
            <input
              placeholder="ex: 123456"
              value={otp}
              onChange={e => { setOtp(e.target.value); setOtpError('') }}
              maxLength={6}
              style={{ width: '100%', padding: '12px 14px', border: `1px solid ${otpError ? '#e53e3e' : '#cbd5e0'}`, borderRadius: 8, fontSize: 20, outline: 'none', boxSizing: 'border-box', letterSpacing: 6, textAlign: 'center', marginBottom: 16 }}
              onFocus={e => e.target.style.borderColor = '#00c9a7'}
              onBlur={e => e.target.style.borderColor = otpError ? '#e53e3e' : '#cbd5e0'}
            />

            {otpError && <p style={{ color: '#e53e3e', fontSize: 13, margin: '-8px 0 12px' }}>{otpError}</p>}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingCode}
                style={{ flex: 1, background: verifyingCode ? '#a0aec0' : '#00c9a7', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: verifyingCode ? 'not-allowed' : 'pointer' }}
              >
                {verifyingCode ? 'Vérification...' : 'Vérifier mon numéro'}
              </button>
              <button
                onClick={() => { setPhoneStep('enter'); setOtp(''); setOtpError('') }}
                style={{ background: 'transparent', color: '#718096', border: 'none', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                Changer de numéro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
