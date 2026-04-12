import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Optimizer from './pages/Optimizer';
import History from './pages/History';
import Templates from './pages/Templates';
import ChainBuilderPage from './pages/ChainBuilderPage';
import ABTesting from './pages/ABTesting';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Optimizer />} />
        <Route path="/history" element={<History />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/chain" element={<ChainBuilderPage />} />
        <Route path="/testing" element={<ABTesting />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Layout>
  );
}
