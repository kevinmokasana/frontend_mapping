import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import GenericUploadPage from './pages/GenericUploadPage';
import TaskHistory from './pages/TaskHistory';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/core-category" replace />} />

          {/* Data Creation */}
          <Route path="core-category" element={<GenericUploadPage title="Create Core Category" endpoint="/core-creation" templateEndpoint="/Core Category Creation.xlsx" />} />
          <Route path="channel-category" element={<GenericUploadPage title="Create Channel Category" endpoint="/channel-creation" templateEndpoint="/Channel Category Creation.xlsx" requiresChannel />} />
          <Route path="core-attribute" element={<GenericUploadPage title="Create Core Attribute" endpoint="/core-attribute-creation" templateEndpoint="/Core Attribute Creation.xlsx" />} />
          <Route path="channel-attribute" element={<GenericUploadPage title="Create Channel Attribute" endpoint="/channel-attribute-creation" templateEndpoint="/Channel Attribute Creation.xlsx" requiresChannel />} />
          <Route path="core-lov" element={<GenericUploadPage title="Create Core LOV" endpoint="/core-reference-data-creation" templateEndpoint="/Core Reference Data.xlsx" />} />
          <Route path="channel-lov" element={<GenericUploadPage title="Create Channel LOV" endpoint="/channel-reference-data-creation" templateEndpoint="/Channel Reference Data Creation.xlsx" requiresChannel />} />

          {/* Mappings */}
          <Route path="mapping/tenant-core-cat" element={<GenericUploadPage title="Tenant to Core Category Mapping" endpoint="/core-tenant-cat-mapping" templateEndpoint="/Category Mapping-Core-Tenant.xlsx" requiresTenant />} />
          <Route path="mapping/core-channel-cat" element={<GenericUploadPage title="Core to Channel Category Mapping" endpoint="/core-channel-cat-mapping" templateEndpoint="/Category Mapping-Core-Channel.xlsx" requiresChannel />} />

          <Route path="mapping/tenant-core-attr" element={<GenericUploadPage title="Tenant to Core Attribute Mapping" endpoint="/core-tenant-attribute-mapping" templateEndpoint="/Attributes Mapping-Core-Tenant.xlsx" requiresTenant />} />
          <Route path="mapping/core-channel-attr" element={<GenericUploadPage title="Core to Channel Attribute Mapping" endpoint="/core-channel-attribute-mapping" templateEndpoint="/Attributes Mapping-Core-Channel.xlsx" requiresChannel />} />

          <Route path="mapping/tenant-core-lov" element={<GenericUploadPage title="Tenant to Core LOV Mapping" endpoint="/core-tenant-lov-mapping" templateEndpoint="/LOV Mapping-Core-Tenant.xlsx" requiresTenant />} />
          <Route path="mapping/core-channel-lov" element={<GenericUploadPage title="Core to Channel LOV Mapping" endpoint="/core-channel-lov-mapping" templateEndpoint="/LOV Mapping-Core-Channel.xlsx" requiresChannel />} />

          {/* Background Tasks */}
          <Route path="task-history" element={<TaskHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
