import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated, isPatient } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary-dark text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-repeat" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-16 md:py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Modern Sağlık Hizmetleri İçin Dijital Çözüm
                </h1>
                <p className="text-xl md:text-2xl font-light mb-8 text-blue-100">
                  Hızlı ve kolay randevu alma, doktor seçme ve sağlık takibi için Horasan Hospital randevu sistemini kullanın.
                </p>
                {isAuthenticated && isPatient ? (
                  <div className="flex flex-wrap gap-4">
                    <Link to="/appointment" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
                      <i className="fas fa-calendar-plus mr-2"></i>
                      Randevu Al
                    </Link>
                    <Link to="/profile" className="btn btn-lg bg-blue-800 hover:bg-blue-900 text-white">
                      <i className="fas fa-user-circle mr-2"></i>
                      Profilim
                    </Link>
                  </div>
                ) : !isAuthenticated && (
                  <div className="flex flex-wrap gap-4">
                    <Link to="/login" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Giriş Yap
                    </Link>
                    <Link to="/register" className="btn btn-lg bg-blue-800 hover:bg-blue-900 text-white">
                      <i className="fas fa-user-plus mr-2"></i>
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-full h-96 bg-blue-400 rounded-xl overflow-hidden shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80" 
                      alt="Healthcare professionals" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-secondary rounded-lg shadow-xl flex items-center justify-center p-6">
                    <div className="text-center text-white">
                      <div className="text-4xl font-bold mb-1">24/7</div>
                      <div className="text-sm uppercase tracking-wider">Online Randevu</div>
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
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Neden Hospital Appointment System?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern teknoloji ile desteklenen sağlık hizmetlerimiz, konfor ve kolaylık sağlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card card-hover">
              <div className="p-6">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <i className="fas fa-user-md text-2xl text-primary"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Uzman Doktorlar</h3>
                <p className="text-gray-600">
                  Alanında uzman doktorlarımızla kaliteli sağlık hizmeti alın. İhtiyacınıza uygun doktoru kolayca bulun.
                </p>
              </div>
            </div>

            <div className="card card-hover">
              <div className="p-6">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <i className="fas fa-calendar-check text-2xl text-secondary"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Kolay Randevu</h3>
                <p className="text-gray-600">
                  Birkaç tıklama ile hızlıca randevu alın. Size en uygun gün ve saati seçerek zamanınızı etkin kullanın.
                </p>
              </div>
            </div>

            <div className="card card-hover">
              <div className="p-6">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                  <i className="fas fa-hospital text-2xl text-accent"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Modern Tesisler</h3>
                <p className="text-gray-600">
                  En son teknoloji ile donatılmış tesislerimizde konforlu bir sağlık hizmeti deneyimi yaşayın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sadece üç adımda randevu alın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Hesap Oluşturun</h3>
              <p className="text-gray-600">
                Hızlı bir şekilde hesap oluşturun ve sisteme giriş yapın.
              </p>
              {!isAuthenticated && (
                <Link to="/register" className="inline-block mt-4 text-primary hover:underline">
                  Kayıt Ol <i className="fas fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Doktor Seçin</h3>
              <p className="text-gray-600">
                Uzmanlık alanı ve konuma göre doktor arayın, size uygun olanı seçin.
              </p>
              {isAuthenticated && isPatient && (
                <Link to="/appointment" className="inline-block mt-4 text-primary hover:underline">
                  Doktor Ara <i className="fas fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Randevu Alın</h3>
              <p className="text-gray-600">
                Size uygun tarih ve saati seçerek randevunuzu tamamlayın.
              </p>
              {isAuthenticated && isPatient && (
                <Link to="/profile" className="inline-block mt-4 text-primary hover:underline">
                  Randevularım <i className="fas fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials or Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-12 bg-gradient-to-br from-primary to-primary-dark text-white">
                <h2 className="text-3xl font-bold mb-6">Hospital Appointment System İstatistikleri</h2>
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
                    Horasan Hospital randevu sistemi sayesinde dakikalar içinde doktor randevusu alabiliyor, 
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