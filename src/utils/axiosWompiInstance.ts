import axios, { AxiosInstance } from 'axios';

const axiosWompi: AxiosInstance = axios.create({
  baseURL: process.env.WOMPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
  },
});

export default axiosWompi;
