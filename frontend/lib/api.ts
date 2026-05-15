import axios from "axios";

// IMPORTANT: Replace with YOUR computer's local IPv4 address.
// On Windows: open a new terminal and run `ipconfig`
// Look for "IPv4 Address" under your active network adapter.
// It will look like 192.168.1.XX or 192.168.0.XX
// Do NOT use "localhost" — your phone cannot reach your PC via localhost.

export const API_BASE = "http://192.168.1.85:3000"; // ← replace this

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});