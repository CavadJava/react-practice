import { useState } from 'react'
import Topbar from '../components/layout/Topbar'
import Panel from '../components/ui/Panel'
import { RoleBadge } from '../components/ui/StatusBadge'
import { useAuthStore } from '../store/auth'

const ACTIVITY_LOG = [
  { icon:'bi-box-arrow-in-right', cls:'c-blue',   text:'Sistemə daxil oldu',                      ip:'192.168.1.45',  time:'11.07.2026 09:14' },
  { icon:'bi-pencil-square',      cls:'c-green',  text:'Müraciət #MÜR-1847 redaktə edildi',       ip:'192.168.1.45',  time:'10.07.2026 17:33' },
  { icon:'bi-person-plus',        cls:'c-purple', text:'Yeni istifadəçi yaradıldı',               ip:'192.168.1.45',  time:'10.07.2026 16:12' },
  { icon:'bi-shield-lock',        cls:'c-orange', text:'Şifrə dəyişdirildi',                      ip:'192.168.1.45',  time:'08.07.2026 11:00' },
  { icon:'bi-download',           cls:'c-teal',   text:'Müştəri siyahısı export edildi',          ip:'10.0.0.12',     time:'07.07.2026 14:22' },
  { icon:'bi-box-arrow-in-right', cls:'c-blue',   text:'Sistemə daxil oldu',                      ip:'10.0.0.12',     time:'07.07.2026 09:01' },
]

function getStrength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)    s++
  if (/[A-Z]/.test(pw))  s++
  if (/[0-9]/.test(pw))  s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const STRENGTH_LABEL = ['','Zəif','Orta','Güclü','Çox Güclü']
const STRENGTH_COLOR = ['','#c62828','#f57f17','#1976d2','#2e7d32']

export default function Profile() {
  const { user, updateProfile, toggle2fa } = useAuthStore()
  const [tab, setTab]       = useState('info')
  const [info, setInfo]     = useState({ ad:user.ad, soyad:user.soyad, email:user.email, telefon:user.telefon, sobe:user.sobe, vezife:user.vezife, about:user.about })
  const [saved, setSaved]   = useState(false)
  const [pw, setPw]         = useState({ cur:'', nw:'', rep:'' })
  const [showPw, setShowPw] = useState({ cur:false, nw:false, rep:false })
  const [pwErr, setPwErr]   = useState('')
  const [pwOk, setPwOk]     = useState(false)
  const [notif, setNotif]   = useState({ email:true, sms:false, push:true, daily:true, weekly:false })

  const strength = getStrength(pw.nw)
  const initials = (user.ad[0]||'') + (user.soyad[0]||'')

  const saveInfo = () => {
    updateProfile(info)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const changePw = () => {
    setPwErr(''); setPwOk(false)
    if (!pw.cur) return setPwErr('Cari şifrəni daxil edin.')
    if (pw.nw.length < 8) return setPwErr('Yeni şifrə ən az 8 simvol olmalıdır.')
    if (pw.nw !== pw.rep) return setPwErr('Şifrələr uyğun gəlmir.')
    setPwOk(true)
    setPw({ cur:'', nw:'', rep:'' })
  }

  const TABS = [
    { id:'info',   icon:'bi-person', label:'Məlumatlar' },
    { id:'pw',     icon:'bi-lock',   label:'Şifrə' },
    { id:'log',    icon:'bi-clock-history', label:'Fəaliyyət' },
    { id:'notif',  icon:'bi-bell',   label:'Bildiriş' },
  ]

  return (
    <>
      <Topbar title="Profil" crumb="Parametrlər / Profil" />
      <main className="content">
        <div className="page-header">
          <h2>Profil Məlumatları</h2>
          <p>Şəxsi məlumatlarınızı və sistem parametrlərini idarə edin</p>
        </div>

        <div className="row g-3">
          {/* Left: hero card */}
          <div className="col-lg-3">
            <Panel className="text-center p-4">
              <div className="profile-avatar mx-auto mb-3">{initials}</div>
              <h4 className="mb-0">{user.ad} {user.soyad}</h4>
              <div className="text-muted small mb-2">{user.vezife}</div>
              <RoleBadge rol={user.rol} />
              <hr />
              <div className="text-start small">
                {[
                  { icon:'bi-envelope',     val: user.email },
                  { icon:'bi-telephone',    val: user.telefon },
                  { icon:'bi-building',     val: user.sobe },
                  { icon:'bi-calendar3',    val: `Qoşulma: ${user.qosulma}` },
                  { icon:'bi-clock-history',val: `Son giriş: ${user.sonGiris}` },
                ].map(({ icon, val }) => (
                  <div key={icon} className="d-flex align-items-center gap-2 mb-2" style={{ color:'#666' }}>
                    <i className={`bi ${icon}`} style={{ width:16, color:'var(--accent)' }}></i>
                    <span style={{ wordBreak:'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="text-start small">
                <label className="form-label mb-1" style={{ fontSize:11, color:'#999', textTransform:'uppercase' }}>İki Mərhələli Doğrulama</label>
                <div className="d-flex align-items-center justify-content-between">
                  <span style={{ fontSize:13 }}>{user.twofa ? 'Aktiv' : 'Deaktiv'}</span>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" role="switch"
                      checked={user.twofa} onChange={toggle2fa} />
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Right: tabs */}
          <div className="col-lg-9">
            <Panel>
              <div className="profile-tabs">
                {TABS.map(t => (
                  <button key={t.id}
                    className={`profile-tab-btn ${tab === t.id ? 'active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    <i className={`bi ${t.icon} me-1`}></i>{t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* INFO TAB */}
                {tab === 'info' && (
                  <div className="row g-3">
                    {[
                      ['ad','Ad'],['soyad','Soyad'],['email','Email'],['telefon','Telefon'],['sobe','Şöbə'],['vezife','Vəzifə']
                    ].map(([k,lbl]) => (
                      <div key={k} className="col-md-6">
                        <label className="form-label">{lbl}</label>
                        <input type="text" className="form-control" value={info[k]}
                          onChange={e => setInfo(f => ({ ...f, [k]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="col-12">
                      <label className="form-label">Haqqımda</label>
                      <textarea className="form-control" rows={3} value={info.about}
                        onChange={e => setInfo(f => ({ ...f, about: e.target.value }))} />
                    </div>
                    <div className="col-12 d-flex align-items-center gap-3">
                      <button className="btn btn-primary" onClick={saveInfo}>
                        <i className="bi bi-check-lg me-1"></i>Yadda Saxla
                      </button>
                      {saved && <span className="text-success small"><i className="bi bi-check2-circle me-1"></i>Dəyişikliklər yadda saxlandı</span>}
                    </div>
                  </div>
                )}

                {/* PASSWORD TAB */}
                {tab === 'pw' && (
                  <div className="row g-3" style={{ maxWidth:460 }}>
                    {[
                      ['cur','Cari Şifrə'],['nw','Yeni Şifrə'],['rep','Yeni Şifrəni Təkrar Et']
                    ].map(([k,lbl]) => (
                      <div key={k} className="col-12">
                        <label className="form-label">{lbl}</label>
                        <div className="input-group">
                          <input
                            type={showPw[k] ? 'text' : 'password'}
                            className="form-control"
                            value={pw[k]}
                            onChange={e => setPw(f => ({ ...f, [k]: e.target.value }))}
                          />
                          <button className="btn btn-outline-secondary" type="button"
                            onClick={() => setShowPw(s => ({ ...s, [k]: !s[k] }))}>
                            <i className={`bi ${showPw[k]?'bi-eye-slash':'bi-eye'}`}></i>
                          </button>
                        </div>
                        {k === 'nw' && pw.nw && (
                          <div className="mt-2">
                            <div className="d-flex gap-1 mb-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{
                                  flex:1, height:4, borderRadius:2,
                                  background: i <= strength ? STRENGTH_COLOR[strength] : '#e0e0e0',
                                  transition: 'background .3s'
                                }} />
                              ))}
                            </div>
                            <small style={{ color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</small>
                          </div>
                        )}
                      </div>
                    ))}
                    {pwErr && <div className="col-12"><div className="alert alert-danger py-2 small mb-0">{pwErr}</div></div>}
                    {pwOk  && <div className="col-12"><div className="alert alert-success py-2 small mb-0"><i className="bi bi-check2-circle me-1"></i>Şifrə uğurla dəyişdirildi</div></div>}
                    <div className="col-12">
                      <button className="btn btn-primary" onClick={changePw}>
                        <i className="bi bi-lock me-1"></i>Şifrəni Dəyiş
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTIVITY TAB */}
                {tab === 'log' && (
                  <div>
                    {ACTIVITY_LOG.map((a, i) => (
                      <div key={i} className="act-item">
                        <div className={`act-icon ${a.cls}`}><i className={`bi ${a.icon}`}></i></div>
                        <div className="flex-grow-1">
                          <div className="act-text fw-600">{a.text}</div>
                          <div className="act-time"><i className="bi bi-globe2 me-1"></i>{a.ip}</div>
                        </div>
                        <small className="act-time text-nowrap">{a.time}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {tab === 'notif' && (
                  <div style={{ maxWidth:480 }}>
                    <p className="text-muted small mb-3">Bildiriş kanallarını və tezliyini seçin.</p>
                    {[
                      { k:'email', label:'E-poçt bildirişləri', desc:'Vacib hadisələr üçün e-poçt alın' },
                      { k:'sms',   label:'SMS bildirişləri',    desc:'Mobil nömrəyə SMS alın' },
                      { k:'push',  label:'Push bildirişlər',    desc:'Brauzer push bildirişlərini aktivləşdirin' },
                      { k:'daily', label:'Gündəlik xülasə',     desc:'Hər gün sabah 08:00-da xülasə alın' },
                      { k:'weekly',label:'Həftəlik hesabat',    desc:'Bazar ertəsi həftəlik hesabat alın' },
                    ].map(({ k, label, desc }) => (
                      <div key={k} className="d-flex align-items-center justify-content-between py-3 border-bottom">
                        <div>
                          <div style={{ fontWeight:600, fontSize:14 }}>{label}</div>
                          <div style={{ fontSize:12, color:'#999' }}>{desc}</div>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" role="switch"
                            checked={notif[k]} onChange={() => setNotif(n => ({ ...n, [k]: !n[k] }))} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3">
                      <button className="btn btn-primary btn-sm">
                        <i className="bi bi-check-lg me-1"></i>Yadda Saxla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </>
  )
}
