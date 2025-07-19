import React, { useEffect, useState } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useAuth } from "../../../contexts/AuthContext";

// ✅ Type definitions
type PasswordField = "password";

interface FormData {
  login: string;
  password: string;
}

const Login = () => {
  const routes = all_routes;
  const navigation = useNavigate();
  const { signin, isAuthenticated, loading } = useAuth();

  // Form state with types
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
  });

  // ✅ FIXED: Better redirect logic with debug logging
  useEffect(() => {
    console.log('Login useEffect - Auth Status:', { 
      isAuthenticated, 
      loading, 
      currentPath: window.location.pathname 
    });

    // Only redirect if user is authenticated AND auth check is complete
    if (isAuthenticated && !loading) {
      console.log('Redirecting authenticated user to dashboard');
      navigation(routes.adminDashboard, { replace: true });
    }
  }, [isAuthenticated, loading, navigation, routes.adminDashboard]);

  // ✅ Fixed with proper typing
  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  // ✅ Fixed with proper event typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // ✅ Fixed with proper form event typing
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    // Basic validation
    if (!formData.login || !formData.password) {
      setError('Veuillez remplir tous les champs');
      setFormLoading(false);
      return;
    }

    try {
      console.log('Attempting signin with:', { login: formData.login });
      const result = await signin(formData);
      
      if (result.success) {
        console.log('Connexion réussie:', result.user);
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        setError(result.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Login error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ FIXED: Show loading ONLY if authenticated and loading
  // Don't block login form for unauthenticated users
  if (loading && isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // ✅ ALWAYS show login form for unauthenticated users or when loading is complete
  return (
    <div className="container-fuild">
      {/* Show a small loading indicator if still loading but not authenticated */}
      {loading && !isAuthenticated && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1050 }}>
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Vérification...</span>
          </div>
        </div>
      )}
      
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath src="assets/img/bg/bg-01.png" className="bg-1" alt="Img" />
                <ImageWithBasePath src="assets/img/bg/bg-02.png" className="bg-2" alt="Img" />
                <ImageWithBasePath src="assets/img/bg/bg-03.png" className="bg-3" alt="Img" />
              </div>
              <div className="authentication-card w-100">
                <div className="authen-overlay-item border w-100">
                  <h1 className="text-white display-1">
                    Empowering people <br /> through seamless HR <br /> management.
                  </h1>
                  <div className="my-4 mx-auto authen-overlay-img">
                    <ImageWithBasePath src="assets/img/bg/authentication-bg-01.png" alt="Img" />
                  </div>
                  <div>
                    <p className="text-white fs-20 fw-semibold text-center">
                      Efficiently manage your workforce, streamline <br />{" "}
                      operations effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className=" mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Sign In</h2>
                        <p className="mb-0">Please enter your details to sign in</p>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                          <i className="ti ti-alert-circle me-2"></i>
                          {error}
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label">Email Address or Username</label>
                        <div className="input-group">
                          <input
                            type="text"
                            name="login"
                            value={formData.login}
                            onChange={handleInputChange}
                            className="form-control border-end-0"
                            placeholder="Enter your email or username"
                            disabled={formLoading}
                            required
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-mail" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="pass-group">
                          <input
                            type={passwordVisibility.password ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pass-input form-control"
                            placeholder="Enter your password"
                            disabled={formLoading}
                            required
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.password
                              ? "ti-eye"
                              : "ti-eye-off"
                              }`}
                            onClick={() => togglePasswordVisibility("password")}
                          ></span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input
                              className="form-check-input"
                              id="remember_me"
                              type="checkbox"
                            />
                            <label
                              htmlFor="remember_me"
                              className="form-check-label mt-0"
                            >
                              Remember Me
                            </label>
                            </div>
                        </div>
                        <div className="text-end">
                          <Link to={routes.forgotPassword} className="link-danger">
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={formLoading || !formData.login || !formData.password}
                        >
                          {formLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Signing In...
                            </>
                          ) : (
                            'Sign In'
                          )}
                        </button>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal text-dark mb-0">
                          Don't have an account?
                          <Link to={routes.register2} className="hover-a">
                            {" "}
                            Create Account
                          </Link>
                        </h6>
                      </div>
                      <div className="login-or">
                        <span className="span-or">Or</span>
                      </div>
                      <div className="mt-2">
                        <div className="d-flex align-items-center justify-content-center flex-wrap">
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-2 btn btn-info d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/facebook-logo.svg"
                                alt="Facebook"
                              />
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-2 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/google-logo.svg"
                                alt="Google"
                              />
                            </Link>
                          </div>
                          <div className="text-center flex-fill">
                            <Link
                              to="#"
                              className="bg-dark br-10 p-2 btn btn-dark d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/apple-logo.svg"
                                alt="Apple"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">Copyright © 2024 - SynergyPark</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
