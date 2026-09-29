import { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import InteractiveBuildingMap from './components/client/InteractiveBuildingMap.jsx';
import OnboardingView from './components/client/OnboardingView.jsx';

export default function App() {
  const [view, setView] = useState('client');
  // Onboarding links look like: https://your-site.com/?onboard=<token>
  const onboardToken = new URLSearchParams(window.location.search).get('onboard');

  return (
    <div dir="rtl" className="flex min-h-screen flex-col font-sans">
      <Navbar view={view} onNavigate={setView} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {onboardToken ? (
          <OnboardingView token={onboardToken} />
        ) : view === 'admin' ? (
          <AdminDashboard />
        ) : (
          <InteractiveBuildingMap />
        )}
      </main>
      <Footer />
    </div>
  );
}
