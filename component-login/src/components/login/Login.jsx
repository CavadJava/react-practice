import React from 'react';

function Login() {
    return (
        <div className="container">
            <div className="row justify-content-between mt-5">
                <div className="col-sm-12 col-md-12 col-lg-12">
                    <div className="card p-4 shadow">
                        <h3 className="card-title text-center mb-4">Login</h3>
                        <form>
                            <div className="form-group mb-3">
                                <label htmlFor="usernameInput" className="form-label visually-hidden">Username: </label>
                                <input type="text"
                                       className="form-control form-control-lg"
                                       placeholder="Username"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label htmlFor="passwordInput" className="form-label visually-hidden">Password: </label>
                                <input type="password"
                                       className="form-control form-control-lg"
                                       id="passwordInput"
                                       placeholder="Password"
                                       required
                                />
                            </div>
                            <div className="d-grid">
                                <br/>
                                <button className="btn btn-primary btn-lg">Login</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login