import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup'; // Validasyon için Yup'ı içe aktarın

// ----------------------------------------------------

// 1. Başlangıç Değerlerini Tanımlayın
const initialValues = {
  email: '',
  password: '',
};

// 2. Validasyon Şemasını (Kurallarını) Tanımlayın (Yup ile)
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Geçerli bir e-posta adresi girin.')
    .required('E-posta zorunludur.'),
  password: Yup.string()
    .min(6, 'Şifre en az 6 karakter olmalıdır.')
    .required('Şifre zorunludur.'),
});

// 3. Form Bileşenini Oluşturun
const YumLoginForm = () => {
  // Form gönderildiğinde çalışacak fonksiyon
  const onSubmit = (values, { setSubmitting }) => {
    // Burada sunucuya giriş isteği gönderilir (API çağrısı)
    console.log('Giriş Denemesi:', values);
    
    // İşlem bittikten sonra formu gönderilebilir hale geri getiririz.
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      setSubmitting(false);
    }, 400);
  };

  return (
    // Formik bileşenini kullanarak mantığı sarmalayın
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {/* Formik bize bir dizi kullanışlı özellik (props) sağlar, 
        ancak bu örnekte sadece Form, Field ve ErrorMessage kullanıyoruz.
      */}
      {({ isSubmitting }) => (
        // Formik'in <Form> bileşeni, tarayıcının standart <form> etiketinin onSubmit özelliğini otomatik olarak yönetir.
        <Form>
          
          {/* E-POSTA ALANI */}
          <div>
            <label htmlFor="email">E-posta</label>
            {/* Formik'in <Field> bileşeni, input değerlerini (value), değişiklikleri (onChange) ve odaklanmayı (onBlur) otomatik olarak yönetir. */}
            <Field name="email" type="email" />
            {/* ErrorMessage, ilgili alanın validasyon hatasını otomatik olarak gösterir. */}
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          {/* ŞİFRE ALANI */}
          <div>
            <label htmlFor="password">Şifre</label>
            <Field name="password" type="password" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          {/* GÖNDER BUTONU */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default YumLoginForm;