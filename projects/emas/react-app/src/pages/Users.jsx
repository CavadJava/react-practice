import { useState, useMemo } from 'react'
import Topbar from '../components/layout/Topbar'
import Panel from '../components/ui/Panel'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { RoleBadge, StatusBadge } from '../components/ui/StatusBadge'
import { useUserStore } from '../store/users'

const ROLLER = ['Admin','Manager','Operator','Viewer']
const SOBELER = ['İnformasiya Texnologiyaları','Sosial Yardım Şöbəsi','Maliyyə Şöbəsi','Hüquq Şöbəsi','Kadrlar Şöbəsi']
const EMPTY_FORM = { ad:'', soyad:'', email:'', sobe:'', rol:'Operator', status:'Aktiv' }

export default function Users() {
  const { users, add, update, remove, toggleBlock } = useUserStore()
  const [search, setSearch]   = useState('')
  const [roleF, setRoleF]     = useState('')
  const [modal, setModal]     = useState(null)
  const [editId, setEditId]   = useState(null)
  const [delId, setDelId]     = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => {
      const mq = !q || `${u.ad} ${u.soyad} ${u.email}`.toLowerCase().includes(q)
      const mr = !roleF || u.rol === roleF
      return mq && mr
    })
  }, [users, search, roleF])

  const total   = users.length
  const online  = users.filter(u => u.online).length
  const admins  = users.filter(u => u.rol === 'Admin').length
  const blocked = users.filter(u => u.status === 'Bloklanan').length

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }
  const openEdit = u => { setForm({ ad:u.ad,soyad:u.soyad,email:u.email,sobe:u.sobe,rol:u.rol,status:u.status }); setEditId(u.id); setModal('edit') }
  const openDel  = u => { setDelId(u.id); setModal('del') }
  const closeModal = () => setModal(null)

  const saveForm = () => {
    if (!form.ad || !form.soyad || !form.email) return alert('Ad, soyad, email mütləqdir.')
    if (editId) update(editId, form)
    else add(form)
    closeModal()
  }
  const confirmDel = () => { remove(delId); closeModal() }
  const fld = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <Topbar title="İstifadəçilər" crumb="Sistem / İstifadəçi İdarəetməsi" />
      <main className="content">
        <div className="page-header d-flex align-items-center justify-content-between">
          <div>
            <h2>İstifadəçi İdarəetməsi</h2>
            <p>Sistem istifadəçilərini idarə edin</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="bi bi-person-plus me-1"></i>Yeni İstifadəçi
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3"><StatCard label="Cəmi İstifadəçi"  value={total}   icon="bi-people-fill"       colorCls="c-blue"   /></div>
          <div className="col-6 col-md-3"><StatCard label="Onlayn"           value={online}  icon="bi-circle-fill"       colorCls="c-green"  /></div>
          <div className="col-6 col-md-3"><StatCard label="Administrator"    value={admins}  icon="bi-shield-fill-check" colorCls="c-red"    /></div>
          <div className="col-6 col-md-3"><StatCard label="Bloklanmış"       value={blocked} icon="bi-slash-circle"      colorCls="c-purple" /></div>
        </div>

        <Panel title="İstifadəçi Siyahısı" icon="bi-person-badge" iconCls="text-primary"
          actions={
            <>
              <input className="form-control form-control-sm" style={{ width:200 }} placeholder="Axtar..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-select form-select-sm" style={{ width:130 }}
                value={roleF} onChange={e => setRoleF(e.target.value)}>
                <option value="">Bütün Rollar</option>
                {ROLLER.map(r => <option key={r}>{r}</option>)}
              </select>
            </>
          }
        >
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>İstifadəçi</th><th>Şöbə</th><th>Rol</th><th>Status</th><th>Son Giriş</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ position:'relative' }}>
                          <Avatar ad={u.ad} soyad={u.soyad} id={u.id} size="sm" />
                          {u.online && (
                            <span style={{
                              position:'absolute', bottom:0, right:0, width:8, height:8,
                              background:'#2e7d32', borderRadius:'50%', border:'1.5px solid #fff'
                            }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{u.ad} {u.soyad}</div>
                          <div style={{ fontSize:11, color:'#999' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><small>{u.sobe}</small></td>
                    <td><RoleBadge rol={u.rol} /></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td><small style={{ color:'#999' }}>{u.giris}</small></td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => openEdit(u)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn btn-sm py-0 px-2 ${u.status==='Bloklanan'?'btn-outline-success':'btn-outline-warning'}`}
                          style={{ fontSize:11 }}
                          onClick={() => toggleBlock(u.id)}
                          title={u.status==='Bloklanan'?'Bloku aç':'Blokla'}
                        >
                          <i className={`bi ${u.status==='Bloklanan'?'bi-unlock':'bi-slash-circle'}`}></i>
                        </button>
                        <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => openDel(u)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">Nəticə tapılmadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-top">
            <small className="text-muted">{filtered.length} istifadəçi göstərilir</small>
          </div>
        </Panel>
      </main>

      <Modal
        show={modal === 'add' || modal === 'edit'}
        onHide={closeModal}
        title={modal === 'edit' ? 'İstifadəçi Redaktə Et' : 'Yeni İstifadəçi'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Ləğv Et</button>
            <button className="btn btn-primary" onClick={saveForm}><i className="bi bi-check-lg me-1"></i>Yadda Saxla</button>
          </>
        }
      >
        <div className="row g-3">
          {[['ad','Ad *'],['soyad','Soyad *'],['email','Email *']].map(([k,lbl]) => (
            <div key={k} className="col-md-6">
              <label className="form-label">{lbl}</label>
              <input type="text" className="form-control" value={form[k]} onChange={e=>fld(k,e.target.value)} />
            </div>
          ))}
          <div className="col-md-6">
            <label className="form-label">Şöbə</label>
            <select className="form-select" value={form.sobe} onChange={e=>fld('sobe',e.target.value)}>
              <option value="">Seçin...</option>
              {SOBELER.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Rol</label>
            <select className="form-select" value={form.rol} onChange={e=>fld('rol',e.target.value)}>
              {ROLLER.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e=>fld('status',e.target.value)}>
              <option>Aktiv</option><option>Bloklanan</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        show={modal === 'del'}
        onHide={closeModal}
        title="İstifadəçini Sil"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={closeModal}>Ləğv Et</button>
            <button className="btn btn-danger btn-sm" onClick={confirmDel}><i className="bi bi-trash me-1"></i>Sil</button>
          </>
        }
      >
        <p>Bu istifadəçini silmək istədiyinizə əminsiniz?</p>
        <p className="text-muted small mt-2">
          {users.find(u=>u.id===delId)?.ad} {users.find(u=>u.id===delId)?.soyad}
          {' — '}{users.find(u=>u.id===delId)?.email}
        </p>
      </Modal>
    </>
  )
}
