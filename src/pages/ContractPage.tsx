import React, { useState } from "react";
import { PlusOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Upload, Modal, message, Card, Row, Col } from "antd";
import type { UploadFile, UploadProps } from "antd";

interface UploadedFile extends UploadFile {
  preview?: string;
  type?: string;
}

const ContractPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  // Convert file to base64 for preview
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // Handle preview
  const handlePreview = async (file: UploadedFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1));
  };

  // Handle file change
  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Custom upload validation
  const beforeUpload = (file: File) => {
    const isValidType = file.type === "image/jpeg" || 
                       file.type === "image/png" || 
                       file.type === "application/pdf";
    
    if (!isValidType) {
      message.error("You can only upload JPG, PNG, or PDF files!");
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    return false; // Prevent auto upload, handle manually
  };

  // Custom request to handle file upload manually
  const customRequest = ({ file, onSuccess }: any) => {
    // Simulate upload success
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload Contract</div>
    </div>
  );

  // Render file preview card
  const renderFileCard = (file: UploadedFile) => {
    const isImage = file.type?.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={file.uid}>
        <Card
          hoverable
          style={{ marginBottom: 16 }}
          cover={
            isImage ? (
              <div style={{ height: 200, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  alt={file.name}
                  src={file.preview || file.url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div style={{ 
                height: 200, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                backgroundColor: "#f5f5f5",
                fontSize: "48px",
                color: "#ff4d4f"
              }}>
                📄
              </div>
            )
          }
          actions={[
            <EyeOutlined key="preview" onClick={() => handlePreview(file)} />,
            <DeleteOutlined 
              key="delete" 
              onClick={() => {
                const newFileList = fileList.filter(item => item.uid !== file.uid);
                setFileList(newFileList);
              }}
            />
          ]}
        >
          <Card.Meta
            title={file.name}
            description={`${(file.size! / 1024 / 1024).toFixed(2)} MB`}
          />
        </Card>
      </Col>
    );
  };

  return (
    <>
      <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
        <h2 style={{ marginBottom: 24 }}>Contract Management</h2>
        
        {/* Upload Area */}
        <div style={{ marginBottom: 32 }}>
          <Upload
            customRequest={customRequest}
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            accept="image/jpeg,image/png,application/pdf"
            showUploadList={false}
          >
            {fileList.length >= 8 ? null : uploadButton}
          </Upload>
          <p style={{ marginTop: 8, color: "#666" }}>
            Supported formats: JPG, PNG, PDF (Max 10MB per file)
          </p>
        </div>

        {/* File Preview Grid */}
        {fileList.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Uploaded Contracts ({fileList.length})</h3>
            <Row gutter={[16, 16]}>
              {fileList.map(renderFileCard)}
            </Row>
          </div>
        )}

        {fileList.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 0", 
            color: "#999",
            border: "2px dashed #d9d9d9",
            borderRadius: "6px"
          }}>
            <PlusOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
            <p>No contracts uploaded yet</p>
            <p>Click the upload button above to add your first contract</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        centered
      >
        {previewImage.includes("data:application/pdf") ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <p>PDF Preview</p>
            <p style={{ color: "#666" }}>{previewTitle}</p>
            <Button type="primary" onClick={() => window.open(previewImage)}>
              Open PDF in New Tab
            </Button>
          </div>
        ) : (
          <img
            alt="preview"
            style={{ width: "100%" }}
            src={previewImage}
          />
        )}
      </Modal>
    </>
  );
};

export default ContractPage;