import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function MannequinUpload() {
  const [mannequinUrl, setMannequinUrl] = useState(null);
  const [uploadedAt, setUploadedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { getAuthToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch existing mannequin image on mount
  useEffect(() => {
    fetchMannequin();
  }, []);

  const fetchMannequin = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/api/auth/mannequin/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.url) {
        setMannequinUrl(response.data.url);
        setUploadedAt(response.data.uploadedAt);
      }
    } catch (err) {
      console.error('Error fetching mannequin:', err);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // Step 1: Get signed upload URL from backend
      const token = await getAuthToken();
      const uploadUrlResponse = await axios.post(
        `${API_URL}/api/auth/mannequin/upload-url/`,
        {
          filename: file.name,
          contentType: file.type,
          fileSize: file.size
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { uploadUrl, filePath } = uploadUrlResponse.data;

      // Step 2: Upload directly to Firebase Storage
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      // Step 3: Confirm upload with backend
      const confirmResponse = await axios.post(
        `${API_URL}/api/auth/mannequin/confirm/`,
        { filePath },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update UI
      setMannequinUrl(confirmResponse.data.url);
      setUploadedAt(confirmResponse.data.uploadedAt);
      setSuccess('Mannequin image uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your mannequin image?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/api/auth/mannequin/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMannequinUrl(null);
      setUploadedAt(null);
      setSuccess('Mannequin image deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete image. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h2>Mannequin Image</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Upload a full-body photo to try on virtual outfits.
      </p>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#efe',
          color: '#060',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      {/* Current Image */}
      {mannequinUrl && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Current Image</h3>
          <img
            src={mannequinUrl}
            alt="Mannequin"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '0.5rem'
            }}
          />
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Uploaded: {uploadedAt ? new Date(uploadedAt).toLocaleString() : 'Unknown'}
          </p>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Delete Image
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div>
        <label
          htmlFor="mannequin-upload"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {uploading ? 'Uploading...' : mannequinUrl ? 'Upload New Image' : 'Upload Image'}
        </label>
        <input
          id="mannequin-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
        Accepted formats: JPG, PNG, HEIC, HEIF, WebP (max 10MB)
      </p>
    </div>
  );
}
