import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function WardrobeManager() {
  const [tops, setTops] = useState([]);
  const [bottoms, setBottoms] = useState([]);
  const [uploading, setUploading] = useState({ top: false, bottom: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const { getAuthToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const topsScrollRef = useRef(null);
  const bottomsScrollRef = useRef(null);

  // Fetch wardrobe items on mount
  useEffect(() => {
    fetchWardrobeItems();
  }, []);

  const fetchWardrobeItems = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      // Fetch both categories in parallel
      const [topsResponse, bottomsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/auth/wardrobe/?category=top`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/auth/wardrobe/?category=bottom`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTops(topsResponse.data.items);
      setBottoms(bottomsResponse.data.items);
    } catch (err) {
      console.error('Error fetching wardrobe:', err);
      setError('Failed to load wardrobe items');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event, category) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading((prev) => ({ ...prev, [category]: true }));

    try {
      // Step 1: Get signed upload URL
      const token = await getAuthToken();
      const uploadUrlResponse = await axios.post(
        `${API_URL}/api/auth/wardrobe/upload-url/`,
        {
          category,
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { uploadUrl, itemId, filePath } = uploadUrlResponse.data;

      // Step 2: Upload to Firebase Storage
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Step 3: Confirm upload
      const confirmResponse = await axios.post(
        `${API_URL}/api/auth/wardrobe/confirm/`,
        { itemId, filePath },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI - add new item to appropriate list
      const newItem = confirmResponse.data.item;
      if (category === 'top') {
        setTops((prev) => [newItem, ...prev]);
      } else {
        setBottoms((prev) => [newItem, ...prev]);
      }

      setSuccess(`${category === 'top' ? 'Top' : 'Bottom'} uploaded successfully!`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload. Please try again.');
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }));
      event.target.value = '';
    }
  };

  const handleDelete = async (itemId, category) => {
    if (!confirm(`Delete this ${category}?`)) return;

    setError('');
    setSuccess('');

    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/api/auth/wardrobe/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update UI - remove from list
      if (category === 'top') {
        setTops((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        setBottoms((prev) => prev.filter((item) => item.id !== itemId));
      }

      setSuccess('Item deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete. Please try again.');
    }
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 250;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderCarousel = (items, category, scrollRef) => (
    <div style={{ marginBottom: '3rem' }}>
      <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
        {category}s ({items.length})
      </h3>

      <div style={{ position: 'relative' }}>
        {/* Left scroll button */}
        {items.length > 0 && (
          <button
            onClick={() => scroll(scrollRef, 'left')}
            style={{
              position: 'absolute',
              left: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            ‹
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="wardrobe-carousel-scroll"
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            padding: '1rem 50px',
          }}
        >
          {items.length === 0 ? (
            <p style={{ color: '#999', margin: '2rem auto' }}>
              No {category}s yet. Upload your first one!
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  minWidth: '200px',
                  maxWidth: '200px',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                }}
              >
                <img
                  src={item.url}
                  alt={`${category} item`}
                  style={{
                    width: '100%',
                    height: '250px',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => handleDelete(item.id, category)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right scroll button */}
        {items.length > 0 && (
          <button
            onClick={() => scroll(scrollRef, 'right')}
            style={{
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Upload button */}
      <div style={{ marginTop: '1rem' }}>
        <label
          htmlFor={`upload-${category}`}
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: uploading[category] ? '#ccc' : '#28a745',
            color: 'white',
            borderRadius: '4px',
            cursor: uploading[category] ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {uploading[category] ? 'Uploading...' : `Upload ${category}`}
        </label>
        <input
          id={`upload-${category}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
          onChange={(e) => handleFileSelect(e, category)}
          disabled={uploading[category]}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading wardrobe...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
      <h2>My Wardrobe</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Upload and manage your clothing items for virtual try-on.
      </p>

      {/* Error/Success Messages */}
      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#efe',
            color: '#060',
            borderRadius: '4px',
          }}
        >
          {success}
        </div>
      )}

      {/* Tops Carousel */}
      {renderCarousel(tops, 'top', topsScrollRef)}

      {/* Bottoms Carousel */}
      {renderCarousel(bottoms, 'bottom', bottomsScrollRef)}

      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '2rem' }}>
        Accepted formats: JPG, PNG, HEIC, HEIF, WebP (max 10MB)
      </p>
    </div>
  );
}
