import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import StatCard from '../components/ui/StatCard'
import Panel from '../components/ui/Panel'

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek']
const BAR_DATA = [
  { m:'Yan', h:62 }, { m:'Fev', h:70 }, { m:'Mar', h:85 },
  { m:'Apr', h:77 }, { m:'May', h:100 }, { m:'İyn', h:89 },
  { m:'İyl', h:116, active:true },
  { m:'Avq', h:0 }, { m:'Sen', h:0 }, { m:'Okt', h:0 }, { m:'Noy', h:0 }, { m:'Dek', h:0 },
]

const LIVE_FEED_ITEMS = [
  { icon:'bi-check2-circle', cls:'c-green',  text:<>Müraciət <strong>#MÜR-1848</strong> daxil oldu</> },
  { icon:'bi-cash',          cls:'c-teal',   text:<><strong>₼3,200</strong> ödənişi tamamlandı</> },
  { icon:'bi-person-plus',   cls:'c-blue',   text:<>Yeni benefisiar <strong>qeydiyyatdan</strong> keçdi</> },
  { icon:'bi-exclamation',   cls:'c-orange', text:<>Müraciət <strong>sənəd çatışmazlığı</strong> ilə dayandırıldı</> },
  { icon:'bi-shield-check',  cls:'c-purple', text:<>Sistem <strong>təhlükəsizlik yoxlaması</strong> tamamlandı</> },
]

export default function Dashboard() {
  const [liveItems, setLiveItems] = useState([
    { icon:'bi-check2-circle', cls:'c-green',  text:<><strong>Rauf Məmmədov</strong> müraciəti təsdiqləndi</>, time:'2 dəq' },
    { icon:'bi-person-plus',   cls:'c-blue',   text:<><strong>3 yeni benefisiar</strong> əlavə edildi</>, time:'18 dəq' },
    { icon:'bi-cash',          cls:'c-teal',   text:<><strong>₼12,400</strong> köçürüldü</>, time:'45 dəq' },
    { icon:'bi-exclamation-triangle', cls:'c-orange', text:<><strong>Nigar Kərimova</strong> rədd edildi</>, time:'1 saat' },
  ])
  const feedRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      const item = LIVE_FEED_ITEMS[feedRef.current % LIVE_FEED_ITEMS.length]
      feedRef.current++
      setLiveItems(prev => [
        { ...item, time: 'Az önce' },
        ...prev.slice(0, 5),
      ])
    }, 18000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Topbar title="İdarəetmə Paneli" crumb="Ana səhifə" />
      <main className="content">
        {/* Page header */}
        <div className="page-header d-flex align-items-center justify-content-between">
          <div>
            <h2>Xoş gəlmisiniz 👋</h2>
            <p>Sistem normal işləyir · <span className="live-dot">Canlı</span></p>
          </div>
          <button className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i>Yeni Müraciət
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label:'Ümumi Benefisiar', value:'148,320', change:'2.4% bu ay',   changeUp:true,  icon:'bi-people-fill',          colorCls:'c-blue'   },
            { label:'Aktiv Müraciət',   value:'1,847',   change:'128 bu həftə', changeUp:true,  icon:'bi-file-earmark-text-fill',colorCls:'c-orange' },
            { label:'Təsdiqlənmiş',     value:'1,209',   change:'65.4%',        changeUp:true,  icon:'bi-check-circle-fill',     colorCls:'c-green'  },
            { label:'Gözləyən',         value:'412',     change:'12 azaldı',    changeUp:false, icon:'bi-hourglass-split',       colorCls:'c-orange' },
            { label:'Bu Ay Ödəniş',     value:'₼2.4M',   change:'5.1% artdı',   changeUp:true,  icon:'bi-cash-stack',            colorCls:'c-teal'   },
            { label:'Rədd Edilmiş',     value:'226',     change:'8 azaldı',     changeUp:false, icon:'bi-x-circle-fill',         colorCls:'c-red'    },
          ].map(s => (
            <div key={s.label} className="col-xl-2 col-lg-4 col-sm-6">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <Panel title="Sürətli Əməliyyatlar" icon="bi-lightning-charge-fill" iconCls="text-warning" className="mb-4">
          <div className="p-3">
            <div className="row g-2">
              {[
                { icon:'bi-file-earmark-plus', label:'Yeni Müraciət', to:null },
                { icon:'bi-person-plus',        label:'Müştəri Əlavə', to:'/customers#new' },
                { icon:'bi-credit-card',        label:'Ödəniş Yarat',  to:null },
                { icon:'bi-search',             label:'Müştəri Axtar', to:'/customers' },
                { icon:'bi-file-bar-graph',     label:'Hesabat Al',    to:null },
                { icon:'bi-people',             label:'İstifadəçilər', to:'/users' },
              ].map(a => (
                <div key={a.label} className="col-6 col-sm-4 col-md-2">
                  {a.to
                    ? <Link to={a.to} className="qa-btn"><i className={`bi ${a.icon}`}></i>{a.label}</Link>
                    : <div className="qa-btn"><i className={`bi ${a.icon}`}></i>{a.label}</div>
                  }
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Chart + Widgets */}
        <div className="row g-3 mb-4">
          {/* Bar chart */}
          <div className="col-lg-8">
            <Panel title="Aylıq Müraciətlər (2026)" icon="bi-bar-chart-line" iconCls="text-primary"
              actions={<small className="text-success"><i className="bi bi-arrow-up-short"></i>18.2% ötən ilə nisbətən</small>}
              className="h-100"
            >
              <div className="p-3">
                <div style={{ display:'flex', alignItems:'flex-end', gap:7, height:140 }}>
                  {BAR_DATA.map(b => (
                    <div key={b.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', gap:4, justifyContent:'flex-end' }}>
                      {b.h > 0 ? (
                        <div
                          style={{
                            width:'100%', borderRadius:'4px 4px 0 0',
                            height: `${Math.min(b.h, 100)}%`,
                            background: b.active ? '#1565c0' : '#d0e8ff',
                            boxShadow: b.active ? '0 4px 12px rgba(21,101,192,.35)' : 'none',
                            transition: 'background .2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { if (!b.active) e.target.style.background = '#1565c0' }}
                          onMouseLeave={e => { if (!b.active) e.target.style.background = '#d0e8ff' }}
                        />
                      ) : (
                        <div style={{ width:'100%', height:'25%', background:'#f0f2f5', borderRadius:'4px 4px 0 0', border:'1px dashed #ddd' }} />
                      )}
                      <small style={{ fontSize:9, color: b.active ? '#1565c0' : '#aaa', fontWeight: b.active ? 700 : 400 }}>
                        {b.m}{b.active ? ' ●' : ''}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Status + Notifications */}
          <div className="col-lg-4 d-flex flex-column gap-3">
            <Panel title="Status Bölgüsü" icon="bi-pie-chart" iconCls="text-success">
              <div className="p-3 d-flex flex-column gap-2">
                {[
                  { label:'Təsdiqlənmiş', pct:65, color:'#2e7d32', bg:'#e8f5e9' },
                  { label:'Gözləyən',     pct:22, color:'#f57f17', bg:'#fff8e1' },
                  { label:'Rədd Edilmiş', pct:12, color:'#c62828', bg:'#ffebee' },
                  { label:'Baxılır',      pct:1,  color:'#1565c0', bg:'#e3f2fd' },
                ].map(s => (
                  <div key={s.label} className="d-flex align-items-center gap-3">
                    <small style={{ minWidth:105, fontWeight:600, fontSize:12 }}>
                      <span style={{ color:s.color }}>●</span> {s.label}
                    </small>
                    <div className="prog-bar flex-grow-1">
                      <div className="prog-fill" style={{ width:`${s.pct}%`, background:s.color }} />
                    </div>
                    <small className="fw-bold">{s.pct}%</small>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Bildirişlər" icon="bi-bell-fill" iconCls="text-danger"
              actions={<span className="badge bg-danger">5</span>}
            >
              {[
                { icon:'bi-hourglass',  cls:'c-orange', title:'24 müraciət gözləyir',  desc:'Təcili baxılmalıdır', time:'2 dəq' },
                { icon:'bi-check2',     cls:'c-green',  title:'Ödəniş tamamlandı',      desc:'₼48,200 köçürüldü',   time:'15 dəq' },
                { icon:'bi-person-plus',cls:'c-blue',   title:'Yeni qeydiyyat',          desc:'12 yeni benefisiar',  time:'1 saat' },
              ].map(n => (
                <div key={n.title} className="act-item">
                  <div className={`act-icon ${n.cls}`}><i className={`bi ${n.icon}`}></i></div>
                  <div className="flex-grow-1">
                    <div className="act-text fw-600">{n.title}</div>
                    <div className="act-time">{n.desc}</div>
                  </div>
                  <small className="act-time">{n.time}</small>
                </div>
              ))}
            </Panel>
          </div>
        </div>

        {/* Recent apps + Activity */}
        <div className="row g-3">
          <div className="col-lg-7">
            <Panel title="Son Müraciətlər" icon="bi-file-earmark-text" iconCls="text-primary"
              actions={
                <>
                  <select className="form-select form-select-sm" style={{ width:130 }}>
                    <option>Hamısı</option><option>Gözləyən</option><option>Təsdiqlənmiş</option>
                  </select>
                  <button className="btn btn-primary btn-sm"><i className="bi bi-plus-lg me-1"></i>Yeni</button>
                </>
              }
            >
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Müraciətçi</th><th>Xidmət</th><th>Tarix</th><th>Status</th></tr></thead>
                  <tbody>
                    {[
                      { initials:'AH', cls:'c-blue',   name:'Aytən Hüseynova', xidmet:'Sosial Yardım', tarix:'11.07', status:'Gözləyən',     sCls:'bs-pending'  },
                      { initials:'RM', cls:'c-green',  name:'Rauf Məmmədov',  xidmet:'Əlillik',       tarix:'10.07', status:'Təsdiqlənmiş', sCls:'bs-approved' },
                      { initials:'LA', cls:'c-purple', name:'Lalə Əliyeva',   xidmet:'Tibbi Sığorta', tarix:'10.07', status:'Baxılır',      sCls:'bs-review'   },
                      { initials:'NK', cls:'c-red',    name:'Nigar Kərimova', xidmet:'Təhsil',        tarix:'09.07', status:'Rədd Edilmiş', sCls:'bs-rejected' },
                    ].map(r => (
                      <tr key={r.name}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className={`avatar avatar-sm ${r.cls}`}>{r.initials}</div>
                            <span style={{ fontWeight:600 }}>{r.name}</span>
                          </div>
                        </td>
                        <td><small>{r.xidmet}</small></td>
                        <td><small>{r.tarix}</small></td>
                        <td><span className={`badge-status ${r.sCls}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="col-lg-5">
            <Panel title="Canlı Fəaliyyət" icon="bi-clock-history"
              actions={<span className="live-dot">Canlı</span>}
            >
              {liveItems.map((item, i) => (
                <div key={i} className="act-item">
                  <div className={`act-icon ${item.cls}`}><i className={`bi ${item.icon}`}></i></div>
                  <div>
                    <div className="act-text">{item.text}</div>
                    <div className="act-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </main>
    </>
  )
}
