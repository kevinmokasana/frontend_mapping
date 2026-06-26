import UploadForm from '../components/Form/UploadForm';

const GenericUploadPage = ({ title, endpoint, requiresChannel, requiresTenant, templateEndpoint }) => {
  return (
    <div className="page-container" style={{ padding: '2rem 0' }}>
      <UploadForm
        title={title}
        endpoint={endpoint}
        requiresChannel={requiresChannel}
        requiresTenant={requiresTenant}
        templateEndpoint={templateEndpoint}
      />
    </div>
  );
};

export default GenericUploadPage;
