/**
 * src/config/api.js
 *
 * Single source of truth for all backend URLs.
 * Set REACT_APP_API_BASE_URL in your .env (local) or Render environment variables.
 *
 * Usage:
 *   import { API_BASE, endpoints } from '../config/api';
 *   fetch(endpoints.latestThreats)
 */

export const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const endpoints = {
  latestThreats: `${API_BASE}/threats/latest`,
  threatHistory: `${API_BASE}/api/threats/history`,
  stats:         `${API_BASE}/api/stats`,
};