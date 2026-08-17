import { useState } from 'react'
import { user, branches } from '../data/mockData'

export default function Profile() {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phonePrefix: user.phonePrefix,
    phone: user.phone,
    idSerial: user.idSerial,
    idNumber: user.idNumber,
    gender: user.gender,
    finCode: user.finCode,
    nationality: user.nationality,
    birthDate: user.birthDate,
    address: user.address,
    branch: user.branch,
    autoDeclaration: false,
  })

  const [passwords, setPasswords] = useState({
    old: '',
    newPass: '',
    repeat: '',
  })

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <div className="content-card">
        <h2>Şəxsi məlumatlar</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Adınız</label>
            <input className="form-control" value={form.firstName} onChange={handleChange('firstName')} />
          </div>
          <div className="form-group">
            <label>Soyadınız</label>
            <input className="form-control" value={form.lastName} onChange={handleChange('lastName')} />
          </div>
          <div className="form-group">
            <label>E-poçta</label>
            <input className="form-control" type="email" value={form.email} onChange={handleChange('email')} />
          </div>
          <div className="form-group">
            <label>Telefon</label>
            <div className="input-prefix-group">
              <select value={form.phonePrefix} onChange={handleChange('phonePrefix')}>
                <option>010</option>
                <option>050</option>
                <option>051</option>
                <option>055</option>
                <option>070</option>
                <option>077</option>
              </select>
              <input value={form.phone} onChange={handleChange('phone')} />
            </div>
          </div>
          <div className="form-group">
            <label>S/v seriya nömrəsi</label>
            <div className="input-prefix-group">
              <select value={form.idSerial} onChange={handleChange('idSerial')}>
                <option>AA</option>
                <option>AZE</option>
              </select>
              <input value={form.idNumber} onChange={handleChange('idNumber')} />
            </div>
          </div>
          <div className="form-group">
            <label>Cins</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === 'male'}
                  onChange={handleChange('gender')}
                />
                Kişi
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === 'female'}
                  onChange={handleChange('gender')}
                />
                Qadın
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>S/V Fin kodu</label>
            <input className="form-control" value={form.finCode} onChange={handleChange('finCode')} />
          </div>
          <div className="form-group">
            <label>Milliyyət</label>
            <select className="form-control" value={form.nationality} onChange={handleChange('nationality')}>
              <option>Azərbaycanlı</option>
              <option>Foreign</option>
            </select>
          </div>
          <div className="form-group">
            <label>Doğum tarixi</label>
            <input className="form-control" type="date" value={form.birthDate} onChange={handleChange('birthDate')} />
          </div>
          <div className="form-group">
            <label>Ünvan</label>
            <input className="form-control" value={form.address} onChange={handleChange('address')} />
          </div>
          <div className="form-group">
            <label>Məntəqə.</label>
            <select className="form-control" value={form.branch} onChange={handleChange('branch')}>
              {branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>avtobeyan</label>
            <div className="toggle-wrap">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.autoDeclaration}
                  onChange={handleChange('autoDeclaration')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-yellow">Yenilə</button>
        </div>
      </div>

      <div className="content-card">
        <h2>Şifrəni yenilə</h2>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Köhnə Şifrə</label>
            <input
              className="form-control"
              type="password"
              value={passwords.old}
              onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifrə</label>
            <input
              className="form-control"
              type="password"
              value={passwords.newPass}
              onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Təkrar şifrə</label>
            <input
              className="form-control"
              type="password"
              value={passwords.repeat}
              onChange={e => setPasswords(p => ({ ...p, repeat: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-yellow">Şifrəni yenilə</button>
        </div>
      </div>
    </>
  )
}
