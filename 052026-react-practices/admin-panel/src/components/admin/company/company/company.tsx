import LeftMenu from "../../menu/leftmenu";

const Company = () => {
    return (
        <div className="container-fluid">
          <div className="row">

            {/* Sidebar */}
            
            
        <LeftMenu />

        {/* Əsas Hissə */}
            <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Şirkətlər</h1>
            </div>

            {/* Kartlar (Statistika) */}
            <div className="row">
                <div className="col-md-4">
                <div className="card text-white bg-primary mb-3">
                    <img src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22286%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20286%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_19e21cc0642%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_19e21cc0642%22%3E%3Crect%20width%3D%22286%22%20height%3D%22180%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107.19140625%22%20y%3D%2296.6%22%3E286x180%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                     className="card-img-top" 
                    alt="Company Logo" />
                    <div className="card-body bg-light">
                        <h5 className="card-title text-black">ExpressBank</h5>
                        <p className="card-text">
                            <ul className="nav flex-column">
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/compas.ea94cda6.svg"
                                         alt="Company Logo" />
                                    <span className="text-black"> Bakı şəh., Y.V. Çəmənzəminli küç., 134C</span></li>
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/clock.d9ad3f61.svg"
                                    alt="Company Logo" />
                                    <span className="text-black"> İş vaxtı: Bazar ertəsi-Cümə: 09.00-18.00 (Kassa 17.15-dək xidmət göstərir)</span></li>
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/phone_info.2027ffff.svg"
                                    alt="Company Logo" />
                                    <span className="text-black"> Telefon nömrələri: 132</span></li>
                            </ul>
                        </p>
                    </div>
                </div>
                </div>
                <div className="col-md-4">
                <div className="card text-white bg-success mb-3">
                    <img src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22286%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20286%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_19e21cc0642%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_19e21cc0642%22%3E%3Crect%20width%3D%22286%22%20height%3D%22180%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107.19140625%22%20y%3D%2296.6%22%3E286x180%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                     className="card-img-top" 
                    alt="Company Logo" />
                    <div className="card-body bg-light">
                        <h5 className="card-title text-black">ABB</h5>
                        <p className="card-text">

                            <ul className="nav flex-column">
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/compas.ea94cda6.svg"
                                         alt="Company Logo" />
                                    <span className="text-black"> Bakı şəh., Y.V. Çəmənzəminli küç., 134C</span></li>
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/clock.d9ad3f61.svg"
                                    alt="Company Logo" />
                                    <span className="text-black"> İş vaxtı: Bazar ertəsi-Cümə: 09.00-18.00 (Kassa 17.15-dək xidmət göstərir)</span></li>
                                <li>
                                    <img className="bg-black p-1 rounded" src="https://www.expressbank.az/assets/img/phone_info.2027ffff.svg"
                                    alt="Company Logo" />
                                    <span className="text-black"> Telefon nömrələri: 132</span></li>
                            </ul>
                        </p>
                    </div>
                </div>
                </div>
            </div>
            </main>
        </div>
    </div>
    )
}
export default Company;