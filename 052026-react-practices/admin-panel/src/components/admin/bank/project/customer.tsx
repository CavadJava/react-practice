const CustomersData  = () => {
    return (
        <div className="container mt-4">
            <h2>Müştəri Siyahısı</h2>
            <table className="table table-striped mt-3">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ad</th>
                        <th>Email</th>
                        <th>Əlaqə Nömrəsi</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Burada müştəri məlumatlarını dinamik olaraq render edə bilərsiniz */}
                    <tr>
                        <td>1</td>
                        <td>John Doe</td>
                        <td></td>
                        <td>+123456789</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Jane Smith</td>
                        <td></td>
                        <td>+987654321</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
export default CustomersData;