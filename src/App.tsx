import { HashRouter, MemoryRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { IS_SANDBOXED } from './env';
import { Layout } from './components/Layout';
import { AppProvider, useApp } from './state/AppContext';
import Dashboard from './pages/Dashboard';
import LibraryPage from './pages/Library';
import Module from './pages/Module';
import LessonPage from './pages/Lesson';
import Reflect from './pages/Reflect';
import CourseSummary from './pages/CourseSummary';
import Simulator from './pages/Simulator';
import Results from './pages/Results';
import Journal from './pages/Journal';
import NotFound from './pages/NotFound';

function LegacyScenarioRedirect() {
  const { id } = useParams();
  return <Navigate to={`/modules/${id}`} replace />;
}

function Routed() {
  const { ready } = useApp();
  if (!ready) return <p className="p-10 text-sm text-slate-600" role="status">Loading your learning space…</p>;
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/modules/:id" element={<Module />} />
      <Route path="/modules/:id/lesson" element={<LessonPage />} />
      <Route path="/modules/:id/reflect" element={<Reflect />} />
      <Route path="/scenarios/:id" element={<LegacyScenarioRedirect />} />
      <Route path="/course-summary" element={<CourseSummary />} />
      <Route path="/simulate/:id" element={<Simulator />} />
      <Route path="/results/:attemptId" element={<Results />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Sandboxed hosts only sync a plain #name, so routes live in memory there.
const Router = IS_SANDBOXED ? MemoryRouter : HashRouter;

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routed />
        </Layout>
      </Router>
    </AppProvider>
  );
}
