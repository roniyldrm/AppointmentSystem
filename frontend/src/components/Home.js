import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated, isPatient } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-repeat opacity-10" 
               style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        </div>
        
        {/* Animated circles */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-3/4 -right-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/3 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-28 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="transform transition-all duration-500 translate-y-0 opacity-100 motion-safe:animate-fadeInUp">
                <div className="mb-6">
                  <span className="logo-text text-5xl font-extrabold tracking-tight">
                    e<span className="text-blue-200 animate-pulse">-</span><span className="relative">pulse
                      <span className="absolute -bottom-1 left-0 w-full h-1 bg-blue-300 rounded animate-pulse"></span>
                    </span>
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Modern Sağlık Hizmetleri İçin 
                  <span className="relative inline-block text-blue-100 ml-2">
                    Dijital Çözüm
                    <svg className="absolute -bottom-1 left-0 w-full" xmlns="http://www.w3.org/2000/svg" height="8" viewBox="0 0 200 8">
                      <path fill="none" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round" d="M0 5c30.928-4.096 68.2-6.732 88 0 18.802 6.732 40.705 3.951 60 0 2.4-.35 52-.35 52-.35" 
                            className="animate-dashOffset" style={{strokeDasharray: 250, strokeDashoffset: 250}}></path>
                    </svg>
                  </span>
                </h1>
                <p className="text-xl md:text-2xl font-light mb-8 text-blue-100">
                  Hızlı ve kolay randevu alma, doktor seçme ve sağlık takibi için 
                  <span className="logo-text mx-2">e<span className="text-blue-200">-</span>pulse</span> 
                  randevu sistemini kullanın.
                </p>
                {isAuthenticated && isPatient ? (
                  <div className="flex flex-wrap gap-4">
                    <Link to="/appointment" className="group relative inline-flex items-center px-8 py-3 overflow-hidden text-lg font-medium text-primary bg-white rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md transform transition-all duration-300 hover:scale-105">
                      <span className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 group-hover:w-full opacity-10"></span>
                      <i className="fas fa-calendar-plus mr-2 text-blue-600"></i>
                      <span className="relative">Randevu Al</span>
                    </Link>
                    <Link to="/profile" className="group relative inline-flex items-center px-8 py-3 overflow-hidden text-lg font-medium text-white bg-blue-800 rounded-full hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 shadow-md transform transition-all duration-300 hover:scale-105">
                      <span className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 group-hover:w-full opacity-10"></span>
                      <i className="fas fa-user-circle mr-2"></i>
                      <span className="relative">Profilim</span>
                    </Link>
                  </div>
                ) : !isAuthenticated && (
                  <div className="flex flex-wrap gap-4">
                    <Link to="/login" className="group relative inline-flex items-center px-8 py-3 overflow-hidden text-lg font-medium text-primary bg-white rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md transform transition-all duration-300 hover:scale-105">
                      <span className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 group-hover:w-full opacity-10"></span>
                      <i className="fas fa-sign-in-alt mr-2 text-blue-600"></i>
                      <span className="relative">Giriş Yap</span>
                    </Link>
                    <Link to="/register" className="group relative inline-flex items-center px-8 py-3 overflow-hidden text-lg font-medium text-white bg-blue-800 rounded-full hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 shadow-md transform transition-all duration-300 hover:scale-105">
                      <span className="absolute left-0 top-0 h-full w-0 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 group-hover:w-full opacity-10"></span>
                      <i className="fas fa-user-plus mr-2"></i>
                      <span className="relative">Kayıt Ol</span>
                    </Link>
                  </div>
                )}
              </div>
              <div className="hidden lg:block motion-safe:animate-fadeInRight">
                <div className="relative">
                  <div className="w-full h-96 bg-blue-400 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
                    <img 
                      src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80" 
                      alt="Healthcare professionals" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent opacity-40"></div>
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gradient-to-br from-green-500 to-green-400 rounded-lg shadow-xl flex items-center justify-center p-6 transform transition-all duration-500 hover:scale-105 hover:rotate-3">
                    <div className="text-center text-white">
                      <div className="text-4xl font-bold mb-1">24/7</div>
                      <div className="text-sm uppercase tracking-wider">Online Randevu</div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center p-4 transform transition-all duration-500 hover:scale-105 hover:-rotate-6">
                    <div className="text-center text-white">
                      <i className="fas fa-heartbeat text-3xl mb-1"></i>
                      <div className="text-xs uppercase tracking-wider mt-1">Sağlığınız Önceliğimiz</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" fill="#f9fafb">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-50 rounded-full filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-50 rounded-full filter blur-3xl opacity-70"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full text-blue-600 bg-blue-100 mb-4 font-medium animate-pulse">Neden Biz?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">e-pulse ile Sağlık Hizmetlerine<br/>Modern Bir Bakış</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern teknoloji ile desteklenen sağlık hizmetlerimiz, konfor ve kolaylık sağlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-blue-500">
              <div className="absolute right-8 top-8 w-16 h-16 bg-blue-500 bg-opacity-10 rounded-full transform transition-all duration-500 group-hover:scale-[1.6] group-hover:opacity-30"></div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6 relative z-10 group-hover:bg-blue-600 group-hover:text-white transform transition-all duration-300">
                <i className="fas fa-user-md text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 relative">Uzman Doktorlar</h3>
              <p className="text-gray-600 mb-6">
                Alanında uzman doktorlarımızla kaliteli sağlık hizmeti alın. İhtiyacınıza uygun doktoru kolayca bulun.
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Doktorlarımız</span>
                <i className="fas fa-arrow-right ml-2 transform transition-transform duration-300 group-hover:translate-x-2"></i>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-green-500 md:mt-8">
              <div className="absolute right-8 top-8 w-16 h-16 bg-green-500 bg-opacity-10 rounded-full transform transition-all duration-500 group-hover:scale-[1.6] group-hover:opacity-30"></div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6 relative z-10 group-hover:bg-green-600 group-hover:text-white transform transition-all duration-300">
                <i className="fas fa-calendar-check text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 relative">Kolay Randevu</h3>
              <p className="text-gray-600 mb-6">
                Birkaç tıklama ile hızlıca randevu alın. Size en uygun gün ve saati seçerek zamanınızı etkin kullanın.
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
                <span>Nasıl Çalışır</span>
                <i className="fas fa-arrow-right ml-2 transform transition-transform duration-300 group-hover:translate-x-2"></i>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-purple-500 md:mt-16">
              <div className="absolute right-8 top-8 w-16 h-16 bg-purple-500 bg-opacity-10 rounded-full transform transition-all duration-500 group-hover:scale-[1.6] group-hover:opacity-30"></div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6 relative z-10 group-hover:bg-purple-600 group-hover:text-white transform transition-all duration-300">
                <i className="fas fa-hospital text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 relative">Modern Tesisler</h3>
              <p className="text-gray-600 mb-6">
                En son teknoloji ile donatılmış tesislerimizde konforlu bir sağlık hizmeti deneyimi yaşayın.
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700">
                <span>Tesislerimiz</span>
                <i className="fas fa-arrow-right ml-2 transform transition-transform duration-300 group-hover:translate-x-2"></i>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <div className="inline-flex flex-wrap justify-center gap-3">
              <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-gray-700 font-medium">7/24 Destek</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-gray-700 font-medium">Online Ödemeler</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-gray-700 font-medium">Tahlil Sonuçları</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-md">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-gray-700 font-medium">Ücretsiz İptal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1 rounded-full text-blue-600 bg-blue-100 mb-4 font-medium">
              Basit Adımlar
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sadece üç adımda randevu alın
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 transform -translate-y-1/2 rounded"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="relative flex flex-col items-center text-center">
                <div className="absolute md:static top-0 z-10 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-xl flex items-center justify-center text-3xl font-bold text-white mb-6">
                      1
                    </div>
                    <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <i className="fas fa-user-plus text-sm"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl w-full mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Hesap Oluşturun</h3>
                  <p className="text-gray-600 mb-6">
                    Hızlı bir şekilde hesap oluşturun ve sisteme giriş yapın. Sadece temel bilgilerinizi vererek kayıt tamamlayın.
                  </p>
                  {!isAuthenticated && (
                    <Link to="/register" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors">
                      <span>Kayıt Ol</span>
                      <i className="fas fa-long-arrow-alt-right ml-2 group-hover:ml-3 transition-all"></i>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="relative flex flex-col items-center text-center">
                <div className="absolute md:static top-0 z-10 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-xl flex items-center justify-center text-3xl font-bold text-white mb-6">
                      2
                    </div>
                    <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <i className="fas fa-search text-sm"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl w-full mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Doktor Seçin</h3>
                  <p className="text-gray-600 mb-6">
                    Uzmanlık alanı, hastane ve konum seçerek doktor arayın. İhtiyacınıza uygun doktoru kolayca bulun.
                  </p>
                  {isAuthenticated && isPatient && (
                    <Link to="/appointment" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors">
                      <span>Doktor Ara</span>
                      <i className="fas fa-long-arrow-alt-right ml-2 transition-all"></i>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="relative flex flex-col items-center text-center">
                <div className="absolute md:static top-0 z-10 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-xl flex items-center justify-center text-3xl font-bold text-white mb-6">
                      3
                    </div>
                    <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <i className="fas fa-calendar-check text-sm"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl w-full mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Randevu Alın</h3>
                  <p className="text-gray-600 mb-6">
                    Size uygun tarih ve saati seçerek randevunuzu tamamlayın. Randevu onayınız e-posta ve SMS ile bildirilir.
                  </p>
                  {isAuthenticated && isPatient && (
                    <Link to="/profile" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors">
                      <span>Randevularım</span>
                      <i className="fas fa-long-arrow-alt-right ml-2 transition-all"></i>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <Link to={isAuthenticated ? "/appointment" : "/register"} className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
              <span>{isAuthenticated ? "Randevu Al" : "Hemen Başla"}</span>
              <i className="fas fa-arrow-right ml-3"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials or Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-12 bg-gradient-to-br from-primary to-primary-dark text-white">
                <h2 className="text-3xl font-bold mb-6">e-pulse İstatistikleri</h2>
                <p className="text-xl font-light mb-8">
                  Türkiye genelinde sağlık hizmeti verdiğimiz hastalarımız ve tıbbi ekibimiz.
                </p>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-bold">10,000+</div>
                    <div className="text-blue-100 mt-1">Hasta</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">500+</div>
                    <div className="text-blue-100 mt-1">Doktor</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">50+</div>
                    <div className="text-blue-100 mt-1">Hastane</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">20+</div>
                    <div className="text-blue-100 mt-1">Şehir</div>
                  </div>
                </div>
              </div>
              <div className="p-10 lg:p-12 bg-white flex items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    "Sağlık hizmetine erişim hiç bu kadar kolay olmamıştı."
                  </h3>
                  <p className="text-gray-600 mb-8">
                    e-pulse randevu sistemi sayesinde dakikalar içinde doktor randevusu alabiliyor, 
                    tüm sağlık geçmişimi tek bir yerden kolayca takip edebiliyorum. 
                    Artık sağlık hizmetlerine erişmek için saatlerce telefonlarda beklemek zorunda değilim.
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">Ayşe Y.</div>
                      <div className="text-sm text-gray-500">İstanbul</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sağlığınız İçin Hemen Randevu Alın
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Size en yakın hastanede, alanında uzman doktorlarımızla tanışın
            </p>
            
            {isAuthenticated && isPatient ? (
              <Link to="/appointment" className="btn btn-lg btn-primary">
                <i className="fas fa-calendar-plus mr-2"></i>
                Hemen Randevu Al
              </Link>
            ) : !isAuthenticated && (
              <div className="space-x-4">
                <Link to="/login" className="btn btn-lg btn-primary">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Giriş Yap
                </Link>
                <Link to="/register" className="btn btn-lg btn-outline">
                  <i className="fas fa-user-plus mr-2"></i>
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 