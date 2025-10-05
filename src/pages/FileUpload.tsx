import React from 'react';
import { Upload, Button, message, Form, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const documentOptions = [
  'SSS',
  'PhilHealth',
  'PagIBIG',
  'PSA',
  'Passport',
  'Training Certificate',
];

const FileUpload = ({ employeeId }) => {
  const [documentType, setDocumentType] = React.useState('');
  const [fileList, setFileList] = React.useState([]);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', employeeId.toString());
    formData.append('documentType', documentType);

    try {
      const response = await axios.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success(response.data.message || 'File uploaded');
      onSuccess(response.data);
    } catch (err) {
      console.error(err);
      message.error('Upload failed');
      onError(err);
    }
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Document Type" required>
        <Select
          placeholder="Select document type"
          onChange={setDocumentType}
          value={documentType}
        >
          {documentOptions.map((type) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Upload Document">
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file]);
            return false; // prevent auto upload
          }}
        >
          <Button icon={<UploadOutlined />} disabled={!documentType}>
            Select File
          </Button>
        </Upload>
      </Form.Item>
    </Form>
  );
};

export default FileUpload;
