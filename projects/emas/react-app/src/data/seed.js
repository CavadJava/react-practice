export const CUSTOMERS = [
  { id:1,  ad:'Aytən',  soyad:'Hüseynova', email:'a.huseynova@mail.az', telefon:'+994501234567', fin:'5BNM234', rayon:'Bakı — Nəsimi',   kat:'Sosial Yardım',  status:'Gözləyən',    tarix:'11.07.2026' },
  { id:2,  ad:'Rauf',   soyad:'Məmmədov',  email:'r.mammadov@mail.az',  telefon:'+994557654321', fin:'7XKP901', rayon:'Gəncə',             kat:'Əlillik',        status:'Aktiv',       tarix:'10.07.2026' },
  { id:3,  ad:'Lalə',   soyad:'Əliyeva',   email:'l.aliyeva@mail.az',   telefon:'+994701112233', fin:'3CQR567', rayon:'Sumqayıt',           kat:'Tibbi Sığorta',  status:'Aktiv',       tarix:'10.07.2026' },
  { id:4,  ad:'Nigar',  soyad:'Kərimova',  email:'n.kerimova@mail.az',  telefon:'+994773334455', fin:'9FZM012', rayon:'Mingəçevir',         kat:'Təhsil',         status:'Qeyri-aktiv', tarix:'09.07.2026' },
  { id:5,  ad:'Samir',  soyad:'İsmayılov', email:'s.ismayilov@mail.az', telefon:'+994515556677', fin:'2HWV345', rayon:'Lənkəran',           kat:'Sosial Yardım',  status:'Aktiv',       tarix:'09.07.2026' },
  { id:6,  ad:'Günel',  soyad:'Babayeva',  email:'g.babayeva@mail.az',  telefon:'+994557778899', fin:'1AAQ678', rayon:'Bakı — Binəqədi',   kat:'Pensiya',        status:'Aktiv',       tarix:'08.07.2026' },
  { id:7,  ad:'Elnur',  soyad:'Quliyev',   email:'e.quliyev@mail.az',   telefon:'+994509998877', fin:'4BRX123', rayon:'Şirvan',             kat:'Əlillik',        status:'Aktiv',       tarix:'07.07.2026' },
  { id:8,  ad:'Sevinc', soyad:'Nəcəfova',  email:'s.nacafova@mail.az',  telefon:'+994702223344', fin:'6JKL890', rayon:'Naxçıvan',           kat:'Tibbi Sığorta',  status:'Qeyri-aktiv', tarix:'06.07.2026' },
  { id:9,  ad:'Tural',  soyad:'Həsənli',   email:'t.hasanli@mail.az',   telefon:'+994514445566', fin:'8MNP234', rayon:'Bakı — Sabunçu',    kat:'Sosial Yardım',  status:'Aktiv',       tarix:'05.07.2026' },
  { id:10, ad:'Könül',  soyad:'Rzayeva',   email:'k.rzayeva@mail.az',   telefon:'+994556667788', fin:'0STV567', rayon:'Gəncə',             kat:'Pensiya',        status:'Aktiv',       tarix:'04.07.2026' },
  { id:11, ad:'Orxan',  soyad:'Abdullayev',email:'o.abdullayev@mail.az',telefon:'+994707778899', fin:'2GHI012', rayon:'Sumqayıt',           kat:'Təhsil',         status:'Qeyri-aktiv', tarix:'03.07.2026' },
  { id:12, ad:'Xədicə', soyad:'Sultanova', email:'x.sultanova@mail.az', telefon:'+994509990011', fin:'3JKL345', rayon:'Bakı — Nəsimi',     kat:'Sosial Yardım',  status:'Bloklanmış',  tarix:'02.07.2026' },
]

export const USERS = [
  { id:1, ad:'İlham',  soyad:'Həsənov',    email:'i.hasanov@emas.gov.az',    sobe:'İnformasiya Texnologiyaları', rol:'Admin',    status:'Aktiv',     giris:'11.07.2026 09:14', online:true  },
  { id:2, ad:'Leyla',  soyad:'Quliyeva',   email:'l.quliyeva@emas.gov.az',   sobe:'Sosial Yardım Şöbəsi',       rol:'Manager',  status:'Aktiv',     giris:'11.07.2026 08:55', online:true  },
  { id:3, ad:'Tural',  soyad:'Abbasov',    email:'t.abbasov@emas.gov.az',    sobe:'Maliyyə Şöbəsi',             rol:'Manager',  status:'Aktiv',     giris:'10.07.2026 17:30', online:false },
  { id:4, ad:'Gülnar', soyad:'Məmmədova',  email:'g.mammadova@emas.gov.az',  sobe:'Sosial Yardım Şöbəsi',       rol:'Operator', status:'Aktiv',     giris:'11.07.2026 09:02', online:true  },
  { id:5, ad:'Rəşad',  soyad:'Əliyev',     email:'r.aliyev@emas.gov.az',     sobe:'Hüquq Şöbəsi',              rol:'Operator', status:'Aktiv',     giris:'09.07.2026 14:22', online:false },
  { id:6, ad:'Anar',   soyad:'Nəsirov',    email:'a.nasirov@emas.gov.az',    sobe:'Sosial Yardım Şöbəsi',       rol:'Operator', status:'Aktiv',     giris:'11.07.2026 10:05', online:false },
  { id:7, ad:'Samirə', soyad:'İbrahimova', email:'s.ibrahimova@emas.gov.az', sobe:'Kadrlar Şöbəsi',             rol:'Viewer',   status:'Bloklanan', giris:'01.06.2026 11:00', online:false },
  { id:8, ad:'Orxan',  soyad:'Hüseyanov',  email:'o.huseyanov@emas.gov.az',  sobe:'Maliyyə Şöbəsi',             rol:'Viewer',   status:'Bloklanan', giris:'15.05.2026 09:40', online:false },
]

export const MODULES = [
  'İdarəetmə Paneli','Müraciətlər','Benefisiarlar',
  'Ödənişlər','Müştərilər','İstifadəçilər','Hesabatlar','Parametrlər',
]

export const PERMS = ['Bax','Əlavə Et','Redaktə Et','Sil']

function makePerms(admin, managerExclude = [], operatorAllow = []) {
  return Object.fromEntries(
    MODULES.map(m => [m, Object.fromEntries(
      PERMS.map(p => [p,
        admin ? true
          : operatorAllow.length
            ? (p === 'Bax' || operatorAllow.includes(m) && p !== 'Sil')
            : (p !== 'Sil' && !managerExclude.includes(m))
      ])
    )])
  )
}

export const ROLES_SEED = [
  { id:1, name:'Admin',    desc:'Tam sistem idarəetməsi.',                          cls:'role-admin',    icon:'bi-shield-fill-check', iconBg:'#ffebee', iconColor:'#b71c1c', userCount:1, perms: makePerms(true) },
  { id:2, name:'Manager',  desc:'Modul idarəetməsi, sistem parametrləri yox.',      cls:'role-manager',  icon:'bi-person-fill-gear',  iconBg:'#e3f2fd', iconColor:'#0d47a1', userCount:2, perms: makePerms(false,['Parametrlər','İstifadəçilər']) },
  { id:3, name:'Operator', desc:'Məlumat daxil etmə, silmə hüququ yoxdur.',         cls:'role-operator', icon:'bi-person-fill-up',    iconBg:'#e8f5e9', iconColor:'#1b5e20', userCount:3, perms: makePerms(false,[],['Müraciətlər','Benefisiarlar','Müştərilər']) },
  { id:4, name:'Viewer',   desc:'Yalnız oxuma hüququ.',                              cls:'role-viewer',   icon:'bi-eye-fill',           iconBg:'#f3e5f5', iconColor:'#4a148c', userCount:2, perms: Object.fromEntries(MODULES.map(m=>[m,Object.fromEntries(PERMS.map(p=>[p,p==='Bax']))])) },
]
