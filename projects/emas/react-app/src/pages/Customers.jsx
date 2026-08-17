import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Line, Doughnut, Bar, PolarArea } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler,
} from 'chart.js'
import Topbar from '../components/layout/Topbar'
import Panel from '../components/ui/Panel'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useCustomerStore } from '../store/customers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler)

const RAYONLAR = ['Bakı — Nəsimi','Bakı — Binəqədi','Bakı — Sabunçu','Gəncə','Sumqayıt','Lənkəran','Mingəçevir','Naxçıvan','Şirvan']
const KATEQORIYALAR = ['Sosial Yardım','Əlillik','Pensiya','Təhsil','Tibbi Sığorta']
const STATUSLAR = ['Aktiv','Qeyri-aktiv','Gözləyən','Bloklanmış']
const PER_PAGE = 10

const EMPTY_FORM = { ad:'', soyad:'', email:'', telefon:'', fin:'', rayon:'', kat:'', status:'Aktiv', qeyd:'' }

export default function Customers() {
  const { customers, add, update, remove } = useCustomerStore()
  const [view, setView]           = useState('table')
  const [search, setSearch]       = useState('')
  const [statusF, setStatusF]     = useState('')
  const [page, setPage]           = useState(1)
  const [modal, setModal]         = useState(null) // null | 'add' | 'edit' | 'del'
  const [editId, setEditId]       = useState(null)
  const [delId, setDelId]         = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [showPwd, setShowPwd]     = useState(false)

  // Filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(c => {
      const mq = !q || `${c.ad} ${c.soyad} ${c.email} ${c.fin}`.toLowerCase().includes(q)
      const ms = !statusF || c.status === statusF
      return mq && ms
    })
  }, [customers, search, statusF])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  // Stats
  const total    = customers.length
  const active   = customers.filter(c=>c.status==='Aktiv').length
  const inactive = customers.filter(c=>c.status==='Qeyri-aktiv').length
  const blocked  = customers.filter(c=>c.status==='Bloklanmış').length

  // CRUD handlers
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }
  const openEdit = c => { setForm({ ad:c.ad,soyad:c.soyad,email:c.email,telefon:c.telefon,fin:c.fin,rayon:c.rayon,kat:c.kat,status:c.status,qeyd:c.qeyd||'' }); setEditId(c.id); setModal('edit') }
  const openDel  = c => { setDelId(c.id); setModal('del') }
  const closeModal = () => setModal(null)

  const saveForm = () => {
    if (!form.ad || !form.soyad || !form.email) return alert('Ad, soyad, email mütləqdir.')
    if (editId) update(editId, form)
    else add(form)
    closeModal()
  }
  const confirmDel = () => { remove(delId); closeModal() }

  const fld = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Chart data
  const regionMap = {}
  customers.forEach(c => { regionMap[c.rayon] = (regionMap[c.rayon]||0)+1 })
  const catMap = {}
  customers.forEach(c => { catMap[c.kat] = (catMap[c.kat]||0)+1 })

  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, grid:{ color:'#f0f2f5' } }, x:{ grid:{ display:false } } } }

  return (
    <>
      <Topbar title="Müştərilər" crumb="CRM / Müştəri İdarəetməsi" />
      <main className="content">
        <div className="page-header d-flex align-items-center justify-content-between">
          <div>
            <h2>Müştəri İdarəetməsi</h2>
            <p>Cəmi <strong>{total}</strong> müştəri qeydiyyatdadır</p>
          </div>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${view==='table'?'btn-primary':'btn-outline-secondary'}`} onClick={() => setView('table')}>
              <i className="bi bi-table me-1"></i>Cədvəl
            </button>
            <button className={`btn btn-sm ${view==='charts'?'btn-primary':'btn-outline-secondary'}`} onClick={() => setView('charts')}>
              <i className="bi bi-bar-chart me-1"></i>Qrafiklər
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1"></i>Yeni Müştəri
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3"><StatCard label="Ümumi"       value={total}    icon="bi-people-fill"         colorCls="c-blue"   /></div>
          <div className="col-6 col-md-3"><StatCard label="Aktiv"       value={active}   icon="bi-check-circle-fill"   colorCls="c-green"  /></div>
          <div className="col-6 col-md-3"><StatCard label="Qeyri-aktiv" value={inactive} icon="bi-pause-circle-fill"   colorCls="c-purple" /></div>
          <div className="col-6 col-md-3"><StatCard label="Bloklanmış"  value={blocked}  icon="bi-x-circle-fill"       colorCls="c-red"    /></div>
        </div>

        {/* TABLE VIEW */}
        {view === 'table' && (
          <Panel title="Müştəri Siyahısı" icon="bi-table" iconCls="text-primary"
            actions={
              <>
                <input
                  className="form-control form-control-sm"
                  style={{ width:200 }}
                  placeholder="Axtar..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
                <select className="form-select form-select-sm" style={{ width:130 }}
                  value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
                  <option value="">Hamısı</option>
                  {STATUSLAR.map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                  const rows = [['Ad','Soyad','Email','Telefon','FİN','Rayon','Kateqoriya','Status','Tarix']]
                  filtered.forEach(c => rows.push([c.ad,c.soyad,c.email,c.telefon,c.fin,c.rayon,c.kat,c.status,c.tarix]))
                  const a = document.createElement('a')
                  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'))
                  a.download = 'musteriler.csv'; a.click()
                }}>
                  <i className="bi bi-download me-1"></i>Export
                </button>
              </>
            }
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Müştəri</th><th>Email</th><th>Telefon</th>
                    <th>Rayon</th><th>Kateqoriya</th><th>Tarix</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar ad={c.ad} soyad={c.soyad} id={c.id} size="sm" />
                          <div>
                            <div style={{ fontWeight:600 }}>{c.ad} {c.soyad}</div>
                            <div style={{ fontSize:11, color:'#999' }}>{c.fin}</div>
                          </div>
                        </div>
                      </td>
                      <td><small>{c.email}</small></td>
                      <td><small>{c.telefon}</small></td>
                      <td><small>{c.rayon}</small></td>
                      <td><small>{c.kat}</small></td>
                      <td><small>{c.tarix}</small></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => openEdit(c)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => openDel(c)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-muted py-4">Nəticə tapılmadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderTop:'1px solid #f5f6f8' }}>
              <small className="text-muted">{filtered.length} müştəridən {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} göstərilir</small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page===1?'disabled':''}`}><button className="page-link" onClick={() => setPage(p=>p-1)}>‹</button></li>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <li key={p} className={`page-item ${p===page?'active':''}`}><button className="page-link" onClick={()=>setPage(p)}>{p}</button></li>
                  ))}
                  <li className={`page-item ${page===totalPages?'disabled':''}`}><button className="page-link" onClick={()=>setPage(p=>p+1)}>›</button></li>
                </ul>
              </nav>
            </div>
          </Panel>
        )}

        {/* CHARTS VIEW */}
        {view === 'charts' && (
          <>
            <div className="row g-3 mb-3">
              <div className="col-lg-8">
                <Panel title="Aylıq Qeydiyyat Trendi (2026)" icon="bi-graph-up" iconCls="text-primary">
                  <div className="p-3">
                    <div className="chart-wrap">
                      <Line data={{
                        labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl'],
                        datasets: [{ label:'Qeydiyyat', data:[45,62,78,55,90,72,110], borderColor:'#1565c0', backgroundColor:'rgba(21,101,192,.1)', fill:true, tension:0.4, pointBackgroundColor:'#1565c0', pointRadius:4 }]
                      }} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f0f2f5'}},x:{grid:{display:false}}} }} />
                    </div>
                  </div>
                </Panel>
              </div>
              <div className="col-lg-4">
                <Panel title="Status Bölgüsü" icon="bi-pie-chart" iconCls="text-success">
                  <div className="p-3">
                    <div className="chart-wrap">
                      <Doughnut data={{
                        labels:['Aktiv','Qeyri-aktiv','Gözləyən','Bloklanmış'],
                        datasets:[{ data:[active,inactive,customers.filter(c=>c.status==='Gözləyən').length,blocked], backgroundColor:['#2e7d32','#6a1b9a','#f57f17','#c62828'], borderWidth:2, borderColor:'#fff' }]
                      }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:12} } } } }} />
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-lg-6">
                <Panel title="Rayon Üzrə Müştərilər" icon="bi-bar-chart" iconCls="text-warning">
                  <div className="p-3">
                    <div className="chart-wrap">
                      <Bar data={{
                        labels: Object.keys(regionMap),
                        datasets:[{ label:'Müştəri', data:Object.values(regionMap), backgroundColor:'#42a5f5', borderRadius:4 }]
                      }} options={chartOpts} />
                    </div>
                  </div>
                </Panel>
              </div>
              <div className="col-lg-6">
                <Panel title="Kateqoriya Üzrə Bölgü" icon="bi-layers" iconCls="text-purple">
                  <div className="p-3">
                    <div className="chart-wrap">
                      <PolarArea data={{
                        labels: Object.keys(catMap),
                        datasets:[{ data:Object.values(catMap), backgroundColor:['rgba(21,101,192,.7)','rgba(46,125,50,.7)','rgba(230,81,0,.7)','rgba(106,27,154,.7)','rgba(0,105,92,.7)'] }]
                      }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} } } } }} />
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ADD / EDIT MODAL */}
      <Modal
        show={modal === 'add' || modal === 'edit'}
        onHide={closeModal}
        title={modal === 'edit' ? 'Müştəri Redaktə Et' : 'Yeni Müştəri'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Ləğv Et</button>
            <button className="btn btn-primary" onClick={saveForm}><i className="bi bi-check-lg me-1"></i>Yadda Saxla</button>
          </>
        }
      >
        <div className="row g-3">
          {[['ad','Ad *','text'],['soyad','Soyad *','text'],['email','Email *','email'],['telefon','Telefon','text'],['fin','FİN Kod','text']].map(([k,lbl,t]) => (
            <div key={k} className="col-md-6">
              <label className="form-label">{lbl}</label>
              <input type={t} className="form-control" value={form[k]} onChange={e=>fld(k,e.target.value)} />
            </div>
          ))}
          <div className="col-md-6">
            <label className="form-label">Rayon</label>
            <select className="form-select" value={form.rayon} onChange={e=>fld('rayon',e.target.value)}>
              <option value="">Seçin...</option>
              {RAYONLAR.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Kateqoriya</label>
            <select className="form-select" value={form.kat} onChange={e=>fld('kat',e.target.value)}>
              <option value="">Seçin...</option>
              {KATEQORIYALAR.map(k=><option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e=>fld('status',e.target.value)}>
              {STATUSLAR.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Qeyd</label>
            <textarea className="form-control" rows={2} value={form.qeyd} onChange={e=>fld('qeyd',e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        show={modal === 'del'}
        onHide={closeModal}
        title="Müştərini Sil"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={closeModal}>Ləğv Et</button>
            <button className="btn btn-danger btn-sm" onClick={confirmDel}><i className="bi bi-trash me-1"></i>Sil</button>
          </>
        }
      >
        <p>Bu müştərini silmək istədiyinizə əminsiniz?</p>
        <p className="text-muted small mt-2">
          {customers.find(c=>c.id===delId)?.ad} {customers.find(c=>c.id===delId)?.soyad}
          {' — '}{customers.find(c=>c.id===delId)?.email}
        </p>
      </Modal>
    </>
  )
}
