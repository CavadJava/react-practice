import { useState } from 'react'
import Topbar from '../components/layout/Topbar'
import Panel from '../components/ui/Panel'
import Modal from '../components/ui/Modal'
import { MODULES, PERMS, ROLES_SEED } from '../data/seed'

const ROL_COLORS = {
  Admin:    { cls:'role-admin',    icon:'bi-shield-fill-check', iconBg:'#ffebee', iconColor:'#b71c1c' },
  Manager:  { cls:'role-manager',  icon:'bi-person-fill-gear',  iconBg:'#e3f2fd', iconColor:'#0d47a1' },
  Operator: { cls:'role-operator', icon:'bi-person-fill-up',    iconBg:'#e8f5e9', iconColor:'#1b5e20' },
  Viewer:   { cls:'role-viewer',   icon:'bi-eye-fill',           iconBg:'#f3e5f5', iconColor:'#4a148c' },
}

function buildEmptyPerms() {
  return Object.fromEntries(MODULES.map(m => [m, Object.fromEntries(PERMS.map(p => [p, false]))]))
}

export default function Roles() {
  const [roles, setRoles]       = useState(ROLES_SEED)
  const [modal, setModal]       = useState(null)
  const [editId, setEditId]     = useState(null)
  const [selRole, setSelRole]   = useState(null) // for permission matrix view
  const [form, setForm]         = useState({ name:'', desc:'', perms: buildEmptyPerms() })

  const openAdd  = () => { setForm({ name:'', desc:'', perms: buildEmptyPerms() }); setEditId(null); setModal('add') }
  const openEdit = r => { setForm({ name:r.name, desc:r.desc, perms: JSON.parse(JSON.stringify(r.perms)) }); setEditId(r.id); setModal('edit') }
  const closeModal = () => setModal(null)

  const saveForm = () => {
    if (!form.name.trim()) return alert('Rol adı mütləqdir.')
    if (editId) {
      setRoles(rs => rs.map(r => r.id === editId ? { ...r, ...form } : r))
    } else {
      const meta = ROL_COLORS[form.name] || { cls:'role-viewer', icon:'bi-person', iconBg:'#f5f5f5', iconColor:'#555' }
      setRoles(rs => [...rs, { id: Date.now(), userCount:0, ...meta, ...form }])
    }
    closeModal()
  }

  const togglePerm = (mod, perm) => {
    setForm(f => ({
      ...f,
      perms: { ...f.perms, [mod]: { ...f.perms[mod], [perm]: !f.perms[mod][perm] } }
    }))
  }

  const toggleAllPerms = (mod) => {
    const allOn = PERMS.every(p => form.perms[mod][p])
    setForm(f => ({
      ...f,
      perms: { ...f.perms, [mod]: Object.fromEntries(PERMS.map(p=>[p,!allOn])) }
    }))
  }

  const removeRole = id => {
    if (!window.confirm('Bu rolu silmək istədiyinizə əminsiniz?')) return
    setRoles(rs => rs.filter(r => r.id !== id))
    if (selRole?.id === id) setSelRole(null)
  }

  return (
    <>
      <Topbar title="Rol İdarəetməsi" crumb="Sistem / Rolllar & İcazələr" />
      <main className="content">
        <div className="page-header d-flex align-items-center justify-content-between">
          <div>
            <h2>Rol İdarəetməsi</h2>
            <p>İstifadəçi rollarını və icazələrini idarə edin</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1"></i>Yeni Rol
          </button>
        </div>

        {/* Role cards */}
        <div className="row g-3 mb-4">
          {roles.map(r => (
            <div key={r.id} className="col-md-6 col-xl-3">
              <div className={`role-card ${r.cls} ${selRole?.id === r.id ? 'ring' : ''}`}
                style={{ cursor:'pointer' }}
                onClick={() => setSelRole(selRole?.id === r.id ? null : r)}
              >
                <div className="role-icon" style={{ background: r.iconBg }}>
                  <i className={`bi ${r.icon}`} style={{ color: r.iconColor, fontSize:22 }}></i>
                </div>
                <div className="role-info">
                  <h3>{r.name}</h3>
                  <p>{r.desc}</p>
                  <div className="role-meta">
                    <span><i className="bi bi-people me-1"></i>{r.userCount} istifadəçi</span>
                    <span><i className="bi bi-shield-check me-1"></i>{Object.values(r.perms).reduce((acc,m)=>acc+Object.values(m).filter(Boolean).length,0)} icazə</span>
                  </div>
                </div>
                <div className="role-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => openEdit(r)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  {r.name !== 'Admin' && (
                    <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize:11 }} onClick={() => removeRole(r.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permission matrix (shown when a role is selected) */}
        {selRole && (
          <Panel
            title={`${selRole.name} — İcazələr Matrisi`}
            icon={selRole.icon}
            iconCls=""
            actions={
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelRole(null)}>
                <i className="bi bi-x-lg me-1"></i>Bağla
              </button>
            }
          >
            <div className="table-responsive">
              <table className="data-table perm-table">
                <thead>
                  <tr>
                    <th>Modul</th>
                    {PERMS.map(p => <th key={p} className="text-center">{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map(m => (
                    <tr key={m}>
                      <td style={{ fontWeight:600 }}>{m}</td>
                      {PERMS.map(p => (
                        <td key={p} className="text-center">
                          {selRole.perms[m]?.[p]
                            ? <i className="bi bi-check-circle-fill" style={{ color:'#2e7d32', fontSize:16 }}></i>
                            : <i className="bi bi-x-circle" style={{ color:'#e0e0e0', fontSize:16 }}></i>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </main>

      {/* Add / Edit Role Modal */}
      <Modal
        show={modal === 'add' || modal === 'edit'}
        onHide={closeModal}
        title={modal === 'edit' ? 'Rolu Redaktə Et' : 'Yeni Rol Yarat'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Ləğv Et</button>
            <button className="btn btn-primary" onClick={saveForm}><i className="bi bi-check-lg me-1"></i>Yadda Saxla</button>
          </>
        }
      >
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Rol Adı *</label>
            <input type="text" className="form-control" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Açıqlama</label>
            <input type="text" className="form-control" value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
          </div>
        </div>

        <p className="text-muted small mb-2">İcazələri seçin:</p>
        <div className="table-responsive">
          <table className="data-table perm-table">
            <thead>
              <tr>
                <th>Modul</th>
                {PERMS.map(p => <th key={p} className="text-center">{p}</th>)}
                <th className="text-center">Hamısı</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map(m => (
                <tr key={m}>
                  <td style={{ fontWeight:600 }}>{m}</td>
                  {PERMS.map(p => (
                    <td key={p} className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!form.perms[m]?.[p]}
                        onChange={() => togglePerm(m, p)}
                      />
                    </td>
                  ))}
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={PERMS.every(p => form.perms[m]?.[p])}
                      onChange={() => toggleAllPerms(m)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  )
}
