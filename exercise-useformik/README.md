# React + Vite
# install formik
<!-- npm install formik --save -->

const {values,handleSubmit,handleChange,handleReset} = useFormik({
    initialValues: {
      username: '',
      fullname: '',
      age: ''
    },
    onSubmit: values => {
      console.log('Form data', values,JSON.stringify(values));
      const newData = [...data,values];
      localStorage.setItem('userData',JSON.stringify(newData));
      console.log()
    },
    onReset: () => {
      console.log('Form reset');
    }
  });

const formik = useFormik({
    initialValues: {
      username: '',
      fullname: '',
      age: ''
    },
    onSubmit: values => {
      console.log('Form data', values,JSON.stringify(values));
      const newData = [...data,values];
      localStorage.setItem('userData',JSON.stringify(newData));
      console.log()
    },
    onReset: () => {
      console.log('Form reset');
    }
  });